"""
Phase 3 — Railway -> Supabase data migration (one-shot).

Not runnable yet. Intentionally lives in `scripts/` as a self-contained
executable that the CTO triggers by hand during the Phase 5 cutover window.

Usage:
    python scripts/migrate_railway_to_supabase.py --dry-run
    python scripts/migrate_railway_to_supabase.py --execute

Required env vars (both):
    RAILWAY_DATABASE_URL   — source Postgres (old Flask DB)
    SUPABASE_DATABASE_URL  — target Postgres (pooler, port 6543)
    SUPABASE_URL           — e.g. https://xxx.supabase.co
    SUPABASE_SERVICE_KEY   — service role key (bypasses RLS; admin API)

Flow:
    1. Read users table from Railway.
    2. For each user, call Supabase Admin API `create_user` with their bcrypt
       hash — this populates auth.users and triggers the ari_users auto-insert.
    3. Update ari_users with profile fields (age_group, income_bracket, etc.)
       that the trigger defaulted.
    4. For each child table, rewrite with new UUIDs where the Railway ID was a
       string, preserving foreign key integrity via a {old_id: new_id} map.
    5. Dry-run: print counts only. Execute: actually insert. Always idempotent
       — safe to re-run on a truncated target.

Gates:
    - Never runs against SUPABASE_DATABASE_URL that contains 'production' unless
      --i-know-what-im-doing is passed.
    - Always prints row-count parity table at the end; aborts on mismatch.
"""

from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass
from typing import Any

# NOTE: imports intentionally deferred — this script shouldn't fail on module
# load when someone greps the repo. They run only inside main().

TABLE_ORDER = [
    # Parents first (no FKs into user-owned data other than ari_users)
    "accounts",
    # Then tables FK'd to users only
    "budgets",
    "goals",
    "tax_profiles",
    "budget_rollovers",
    "user_categories",
    "todo_notes",
    "feedbacks",
    # Expenses last because parent_recurring_id self-references within the table
    "expenses",
]

RENAMES = {
    # railway table -> supabase table
    "users": "ari_users",
    "transactions": "expenses",
    "savings_goals": "goals",
}

COLUMN_RENAMES = {
    # (supabase_table) -> {old_col: new_col}
    "expenses": {"date": "expense_date"},
    "goals": {"current_amount": "saved_amount"},
    "budgets": {"limit_amount": "monthly_limit"},
}


@dataclass
class MigrationConfig:
    railway_url: str
    supabase_db_url: str
    supabase_url: str
    supabase_service_key: str
    dry_run: bool
    force_prod: bool


def parse_args() -> MigrationConfig:
    p = argparse.ArgumentParser()
    mode = p.add_mutually_exclusive_group(required=True)
    mode.add_argument("--dry-run", action="store_true", help="Print counts only.")
    mode.add_argument("--execute", action="store_true", help="Perform the migration.")
    p.add_argument("--i-know-what-im-doing", action="store_true")
    args = p.parse_args()

    required = ("RAILWAY_DATABASE_URL", "SUPABASE_DATABASE_URL", "SUPABASE_URL", "SUPABASE_SERVICE_KEY")
    missing = [k for k in required if not os.getenv(k)]
    if missing:
        sys.exit(f"Missing env vars: {', '.join(missing)}")

    return MigrationConfig(
        railway_url=os.environ["RAILWAY_DATABASE_URL"],
        supabase_db_url=os.environ["SUPABASE_DATABASE_URL"],
        supabase_url=os.environ["SUPABASE_URL"],
        supabase_service_key=os.environ["SUPABASE_SERVICE_KEY"],
        dry_run=args.dry_run,
        force_prod=args.i_know_what_im_doing,
    )


def migrate_users(cfg: MigrationConfig) -> dict[str, str]:
    """Bulk-create auth.users via Supabase Admin API.

    Returns: {railway_user_id: supabase_user_id}. Because we set the new
    auth.users.id to the existing Railway user id (both are UUIDs/UUID-ish
    strings), this map is typically the identity function — but we keep it
    explicit so that any mismatches surface loudly.
    """
    raise NotImplementedError(
        "Phase 3 — flesh out when Supabase project exists and creds are set. "
        "Use psycopg2 for Railway read, supabase-py for Admin API, pass "
        "password_hash verbatim (bcrypt transfers as-is to gotrue)."
    )


def migrate_child_table(cfg: MigrationConfig, table: str, id_map: dict[str, str]) -> int:
    """Copy one table, rewriting user_id per the id_map and renaming columns."""
    raise NotImplementedError("Phase 3 — implement alongside migrate_users().")


def verify_parity(cfg: MigrationConfig) -> bool:
    """Row-count parity: railway.table count must equal supabase.table count."""
    raise NotImplementedError("Phase 3 — run after migrate_*().")


def main() -> None:
    cfg = parse_args()

    if "production" in cfg.supabase_db_url and not cfg.force_prod:
        sys.exit(
            "Refusing to target what looks like production. "
            "Pass --i-know-what-im-doing to override."
        )

    print(f"[{'DRY-RUN' if cfg.dry_run else 'EXECUTE'}] source={cfg.railway_url.split('@')[-1]}")
    print(f"[{'DRY-RUN' if cfg.dry_run else 'EXECUTE'}] target={cfg.supabase_db_url.split('@')[-1]}")

    print("Phase 3 is scaffolded but not implemented. See SUPABASE_MIGRATION.md.")
    sys.exit(2)


if __name__ == "__main__":
    main()
