
# 🧠 Ari – AI-Powered Calm Finance Companion  
### Comprehensive Developer Handoff (Mobile-First, AI-Integrated, Payment-Ready)

---

## ✅ PURPOSE  
Ari is an **emotion-aware financial companion** for individuals, families, and small business owners.  
It combines **expense tracking**, **collaborative budgeting**, **AI nudges**, and **guided payments** in one calm, privacy-first app.

---

## 🔥 CORE MODULES

### 1. 🎯 Onboarding & Identity
- Choose: Individual | Family | MSME
- Setup income, roles, family code (if collaborative)
- Save user type + role in Firestore

### 2. 📦 Expense & Income Tracker
- Manual add/edit/delete transactions
- Categories: Essentials, Lifestyle, Debt, Health, Investment
- Offline-first with sync
- Custom tags + notes

### 3. 📊 Budget Planner
- Monthly or category-based budgets
- Visual indicators (pie/bar)
- Alerts for overspend/underspend
- AI-suggested limits (phase 2)

### 4. ⏰ Bill Reminders
- Assignable reminders (rent, fees, utilities)
- Smart nudges with emotional tones
- Notifications

### 5. 🧠 AI Assistant: Tomo (OpenAI GPT-4)
- Weekly financial summary nudge
- Emotional, positive reinforcement
- Query-based analysis (Ask Tomo)
- Receivable follow-up drafts
- Habits and “close your books” rituals

### 6. 💸 Receivables & Credit Ledger
- Track money owed/given
- Status: pending, paid, overdue
- Emotion tag: safe, tense, drifting
- AI-generated follow-ups via WhatsApp/SMS

### 7. 🧾 Micro-Invoicing (MSME Mode)
- Invoice with itemized list
- Payment method: UPI, cash, bank
- Linked to receivables
- Shareable via WhatsApp/Email

### 8. 🧑‍🤝‍🧑 Family/Partner Collaboration
- Join via family code
- Role-based access: view/edit/admin
- Shared dashboard

### 9. 🧮 Ask Tomo – AI Query Assistant
- User asks: “What’s my top spend this month?”
- Tomo analyzes Firestore data
- Responds in natural language
- Powered by OpenAI GPT-4

### 10. 🔒 Sacred Vault
- PIN/biometric lock
- Store private expenses, notes, documents
- Fully offline encrypted

### 11. 🌗 Offline Mode + Cloud Sync
- Add/view transactions offline
- Sync when online
- Visual sync status

### 12. 💬 AI Nudges & Financial Habits
- Streak tracking, karma points
- Gentle habit prompts: “Thank someone today”
- Monthly financial health score (AI graded)

### 13. 📱 UPI + Payments (Phase 3)
- UPI-based settlement (PhonePe SDK)
- Pay from reminders or split bills
- Smart nudges: “Want to pay rent now?”

### 14. 📉 Visual Reports
- Downloadable PDFs
- AI-generated summaries
- Trends, month-over-month comparison

---

## 🔗 FIRESTORE COLLECTIONS

| Collection | Description |
|------------|-------------|
| users | user_id, name, email, type, family_id, role |
| families | family_code, members[], created_by |
| expenses | amount, category, tags, user_id/family_id |
| income | amount, source, date, user_id/family_id |
| budgets | total_limit, categories[], user_id/family_id |
| reminders | due_date, repeat, assigned_to |
| nudges | AI-generated messages |
| receivables | from, to, due_date, status, emotion_tag |
| invoices | items[], status, linked_receivable |

---

## 🧠 AI BACKEND (REPLIT + OPENAI)

- Node.js server with Firebase Admin SDK
- Weekly cron to generate nudges
- `/ask` endpoint: accepts query + context → returns GPT-4 response
- Prompt template stored per module

---

## 🧱 FOLDER STRUCTURE (Cursor/Expo)

```
/src
  /components
    Dashboard.tsx
    ExpenseForm.tsx
    AskTomoInput.tsx
  /services
    firestoreService.ts
    aiService.ts
  /hooks
    useAskTomo.ts
/backend
  server.js
.env
```

---

## 🔐 SECURITY RULES
- Users can only access their own or family data
- Role-based access enforced
- Admin SDK bypass only used server-side (Replit)

---

## ✅ BUILD SEQUENCE (PHASED)

### 🔹 Phase 1 (MVP)
- Auth, onboarding, Firestore rules
- Personal & Family modes
- Income, expenses, dashboard
- Reminders + notifications
- Receivables
- Weekly AI nudges

### 🔹 Phase 2 (AI Layer)
- Ask Tomo chat
- AI health score, nudges, summaries
- Sacred vault
- Ritual prompts & gamification

### 🔹 Phase 3 (Payments & MSME)
- UPI integration
- Micro-invoicing
- Credit settlements
- MSME dashboard

---

## 🧹 BEST PRACTICES

- Modular architecture (components + services)
- Keep AI prompts clean and token-efficient
- Avoid over-generating with OpenAI
- Use Firestore pagination for large reads
- Memoize chart data

---

## 🧭 SUMMARY

Ari is more than an app — it’s a **mindful, trustworthy, AI-powered financial guide**  
that respects emotion, simplicity, and family connection.

Build with heart.  
Test with empathy.  
Launch with confidence.

---

“Let’s build something all will love.” 🤍
