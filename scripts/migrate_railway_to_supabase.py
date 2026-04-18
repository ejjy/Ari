#!/usr/bin/env python3
"""
Phase 3 — Railway -> Supabase data migration (one-shot).

Broader plan: SUPABASE_MIGRATION.md (Phase 3 section).

Flow:
  1. Read every row from the Railway Flask DB.
  2. For each user, POST to /auth/v1/admin/users with the bcrypt
     password_hash AND the original UUID preserved — a trigger auto-creates
     the ari_users row; we then UPDATE it with Flask-specific onboarding
     fields. Preserving UUIDs avoids the need to remap foreign keys in any
     child table.
  3. Copy each child table to its Supabase counterpart via direct psycopg2
     to the pooler (postgres role bypasses RLS). Renames:
         transactions   -> expenses     (date -> expense_date)
         savings_goals  -> goals        (current_amount -> saved_amount)
         budgets        -> budgets      (limit_amount -> monthly_limit,
                                         month text -> date first-of-month)
     Adds spec §4 columns with sensible defaults: parse_source='local',
     entry_type='manual', confidence NULL.
  4. Verify row-count parity. Abort on mismatch.

Run from the BACKEND venv (psycopg2, supabase, httpx, python-dotenv already
installed there):

    cd backend
    ./venv/Scripts/python.exe ../scripts/migrate_railway_to_supabase.py --dry-run
    ./venv/Scripts/python.exe ../scripts/migrate_railway_to_supabase.py --execute

Env vars (put in backend/.env, which is gitignored):
    RAILWAY_DATABASE_URL        source Flask Postgres
    SUPABASE_URL                https://<ref>.supabase.co
    SUPABASE_SERVICE_ROLE_KEY   service role (bypasses RLS; admin API)
    SUPABASE_DATABASE_URL       target pooler URL (port 6543, postgres role)
"""

from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass
from typing import Any, Callable


# -----------------------------------------------------------------------------
# Table copy plan
# -----------------------------------------------------------------------------
# Each entry: (railway_table, supabase_table, column_renames, extra_defaults,
# value_transforms). value_transforms runs AFTER renames, receives the row
# dict, mutates it in place (e.g. for "YYYY-MM" -> "YYYY-MM-01" conversion).


def _month_text_to_date(row: dict[str, Any]) -> None:
    """Normalise 'YYYY-MM' column values to 'YYYY-MM-01' so Postgres casts
    them to DATE cleanly. Applies to any column whose current value is a
    7-char string matching 'YYYY-MM'."""
    for k, v in list(row.items()):
        if isinstance(v, str) and len(v) == 7 and v[4] == "-":
            row[k] = f"{v}-01"


def _tags_csv_to_array(row: dict[str, Any]) -> None:
    """Flask stores transactions.tags as comma-separated TEXT; Supabase
    expenses.tags is TEXT[]. Convert 'a,b,c' -> ['a','b','c']."""
    v = row.get("tags")
    if isinstance(v, str):
        row["tags"] = [t.strip() for t in v.split(",") if t.strip()]
    elif v is None:
        row["tags"] = None


TABLES_TO_COPY: list[tuple[str, str, dict[str, str], dict[str, Any], list[Callable[[dict[str, Any]], None]]]] = [
    # railway_table,     supabase_table,   renames,                      defaults,                                    transforms
    ("transactions",     "expenses",       {"date": "expense_date"},     {"parse_source": "local", "entry_type": "manual"}, [_tags_csv_to_array]),
    ("budgets",          "budgets",        {"limit_amount": "monthly_limit"}, {},                                     [_month_text_to_date]),
    ("savings_goals",    "goals",          {"current_amount": "saved_amount"}, {},                                    []),
    ("tax_profiles",     "tax_profiles",   {},                           {},                                          []),
    ("budget_rollovers", "budget_rollovers", {},                         {},                                          [_month_text_to_date]),
    ("user_categories",  "user_categories", {},                          {},                                          []),
    ("todo_notes",       "todo_notes",     {},                           {},                                          []),
    ("feedbacks",        "feedbacks",      {},                           {},                                          []),
]


# -----------------------------------------------------------------------------
# Config
# -----------------------------------------------------------------------------


@dataclass
class MigrationConfig:
    railway_url: str
    supabase_db_url: str
    supabase_url: str
    supabase_service_role_key: str
    dry_run: bool
    force_non_empty: bool


def parse_args() -> MigrationConfig:
    p = argparse.ArgumentParser(description="Railway -> Supabase one-shot migration.")
    mode = p.add_mutually_exclusive_group(required=True)
    mode.add_argument("--dry-run", action="store_true", help="Print counts and plan only — no writes.")
    mode.add_argument("--execute", action="store_true", help="Perform the migration.")
    p.add_argument(
        "--force-non-empty",
        action="store_true",
        help="Override the safety check that refuses to run when Supabase ari_users is non-empty.",
    )
    args = p.parse_args()

    # Load backend/.env if running from repo root; harmless if already loaded.
    try:
        from dotenv import load_dotenv
        load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))
    except ImportError:
        pass

    required = ("RAILWAY_DATABASE_URL", "SUPABASE_DATABASE_URL", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")
    missing = [k for k in required if not os.getenv(k)]
    if missing:
        sys.exit(f"Missing env vars: {', '.join(missing)}.\nSet them in backend/.env or export directly.")

    return MigrationConfig(
        railway_url=os.environ["RAILWAY_DATABASE_URL"],
        supabase_db_url=os.environ["SUPABASE_DATABASE_URL"],
        supabase_url=os.environ["SUPABASE_URL"].rstrip("/"),
        supabase_service_role_key=os.environ["SUPABASE_SERVICE_ROLE_KEY"],
        dry_run=args.dry_run,
        force_non_empty=args.force_non_empty,
    )


# -----------------------------------------------------------------------------
# Users (admin API preserves UUIDs, so FK remap is unnecessary)
# -----------------------------------------------------------------------------


def migrate_users(cfg: MigrationConfig, railway_conn, supabase_conn) -> int:
    """Create auth.users for every Railway user (preserving UUID + bcrypt hash),
    then UPDATE the trigger-provisioned ari_users row with Flask onboarding
    fields. Returns count migrated."""
    import httpx

    with railway_conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, email, password_hash, name, phone, age_group, income_bracket,
                   main_goal, role, currency, created_at
            FROM users
            ORDER BY created_at
            """
        )
        rows = cur.fetchall()
        colnames = [d[0] for d in cur.description]

    migrated = 0
    headers = {
        "apikey": cfg.supabase_service_role_key,
        "Authorization": f"Bearer {cfg.supabase_service_role_key}",
        "Content-Type": "application/json",
    }

    with httpx.Client(timeout=30) as http, supabase_conn.cursor() as upd_cur:
        for row in rows:
            r = dict(zip(colnames, row))

            # Create auth.users with preserved UUID + bcrypt hash. gotrue's
            # admin API accepts `id` in the JSON body even though supabase-py
            # doesn't expose it in its typed wrapper.
            resp = http.post(
                f"{cfg.supabase_url}/auth/v1/admin/users",
                headers=headers,
                json={
                    "id": r["id"],
                    "email": r["email"],
                    "password_hash": r["password_hash"],
                    "email_confirm": True,
                    "phone": r["phone"] or None,
                    "user_metadata": {"full_name": r["name"]},
                },
            )
            if resp.status_code in (409, 422) and "already" in resp.text.lower():
                print(f"  [skip] user {r['email']} already exists in Supabase auth")
                continue
            resp.raise_for_status()

            # The on_auth_user_created trigger already inserted an ari_users
            # row with default onboarding values. Update it with the real ones.
            upd_cur.execute(
                """
                UPDATE ari_users
                   SET name = %s,
                       phone = %s,
                       age_group = %s,
                       income_bracket = %s,
                       main_goal = %s,
                       role = %s,
                       currency = %s,
                       created_at = %s
                 WHERE id = %s
                """,
                (
                    r["name"], r["phone"], r["age_group"], r["income_bracket"],
                    r["main_goal"], r["role"], r["currency"], r["created_at"], r["id"],
                ),
            )
            migrated += 1

        supabase_conn.commit()

    return migrated


# -----------------------------------------------------------------------------
# Child tables (generic column-rename + default-apply copy)
# -----------------------------------------------------------------------------


def copy_table(
    railway_conn,
    supabase_conn,
    src_table: str,
    dst_table: str,
    renames: dict[str, str],
    defaults: dict[str, Any],
    transforms: list[Callable[[dict[str, Any]], None]],
) -> int:
    """SELECT * FROM src_table, apply renames/defaults/transforms, INSERT INTO dst_table.
    Uses a single transaction per table — rollback on any row error."""
    with railway_conn.cursor() as cur:
        cur.execute(f"SELECT * FROM {src_table}")
        rows = cur.fetchall()
        colnames = [d[0] for d in cur.description]

    if not rows:
        return 0

    # Discover the destination column whitelist so we can drop any Flask-only
    # columns (e.g. old timestamps, helper fields) that don't exist in Supabase.
    with supabase_conn.cursor() as cur:
        cur.execute(
            """
            SELECT column_name FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = %s
            """,
            (dst_table,),
        )
        dst_cols = {r[0] for r in cur.fetchall()}

    inserted = 0
    with supabase_conn.cursor() as cur:
        for row in rows:
            rec = dict(zip(colnames, row))

            # 1. Column renames
            for old, new in renames.items():
                if old in rec:
                    rec[new] = rec.pop(old)

            # 2. Apply transforms (dates, tags array, etc.)
            for fn in transforms:
                fn(rec)

            # 3. Drop columns that don't exist in destination
            rec = {k: v for k, v in rec.items() if k in dst_cols}

            # 4. Apply defaults for missing required columns
            for k, v in defaults.items():
                rec.setdefault(k, v)

            cols = list(rec.keys())
            placeholders = ", ".join(["%s"] * len(cols))
            colnames_sql = ", ".join(f'"{c}"' for c in cols)
            cur.execute(
                f"INSERT INTO {dst_table} ({colnames_sql}) VALUES ({placeholders})",
                [rec[c] for c in cols],
            )
            inserted += 1

        supabase_conn.commit()

    return inserted


# -----------------------------------------------------------------------------
# Dry-run + parity check
# -----------------------------------------------------------------------------


def count_rows(conn, table: str) -> int:
    with conn.cursor() as cur:
        try:
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            return cur.fetchone()[0]
        except Exception:
            conn.rollback()
            return -1  # table doesn't exist


def print_counts(railway_conn, supabase_conn) -> None:
    print("\n--- Row counts ---")
    print(f"{'RAILWAY':<22} {'SUPABASE':<22}  delta")
    pairs: list[tuple[str, str]] = [("users", "ari_users")] + [(s, d) for s, d, *_ in TABLES_TO_COPY]
    for src, dst in pairs:
        r = count_rows(railway_conn, src)
        s = count_rows(supabase_conn, dst)
        delta = s - r if (r >= 0 and s >= 0) else "-"
        print(f"{src:<15}={r:<5}  {dst:<15}={s:<5}  {delta}")


def verify_parity(railway_conn, supabase_conn) -> bool:
    ok = True
    pairs: list[tuple[str, str]] = [("users", "ari_users")] + [(s, d) for s, d, *_ in TABLES_TO_COPY]
    for src, dst in pairs:
        r = count_rows(railway_conn, src)
        s = count_rows(supabase_conn, dst)
        if r != s:
            print(f"  [parity fail] {src}={r} vs {dst}={s}")
            ok = False
    return ok


# -----------------------------------------------------------------------------
# Gate — refuse to clobber an already-populated Supabase
# -----------------------------------------------------------------------------


def assert_target_empty_or_forced(supabase_conn, force: bool) -> None:
    n = count_rows(supabase_conn, "ari_users")
    if n > 0 and not force:
        sys.exit(
            f"Supabase ari_users already has {n} rows. Refusing to run.\n"
            "  Either truncate (TRUNCATE ari_users CASCADE) or re-run with "
            "--force-non-empty."
        )


# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------


def main() -> None:
    cfg = parse_args()

    import psycopg2

    print(f"[{'DRY-RUN' if cfg.dry_run else 'EXECUTE'}] source = {cfg.railway_url.split('@')[-1]}")
    print(f"[{'DRY-RUN' if cfg.dry_run else 'EXECUTE'}] target = {cfg.supabase_db_url.split('@')[-1]}")

    railway_conn = psycopg2.connect(cfg.railway_url)
    supabase_conn = psycopg2.connect(cfg.supabase_db_url)

    try:
        if cfg.dry_run:
            print_counts(railway_conn, supabase_conn)
            print("\nDry-run complete. Re-run with --execute to migrate.")
            return

        assert_target_empty_or_forced(supabase_conn, cfg.force_non_empty)

        print("\n[1/3] Migrating users ...")
        n = migrate_users(cfg, railway_conn, supabase_conn)
        print(f"       OK — {n} users")

        print("\n[2/3] Migrating child tables ...")
        for src, dst, renames, defaults, transforms in TABLES_TO_COPY:
            n = copy_table(railway_conn, supabase_conn, src, dst, renames, defaults, transforms)
            print(f"       {src:<17} -> {dst:<17}  {n} rows")

        print("\n[3/3] Verifying row-count parity ...")
        if not verify_parity(railway_conn, supabase_conn):
            sys.exit("Parity mismatch — investigate before continuing.")
        print("       OK — all tables match.")

        print("\nMigration complete.")

    finally:
        railway_conn.close()
        supabase_conn.close()


if __name__ == "__main__":
    main()
