# Due Date

**Due Date** is a premium, full-stack gym subscription manager and payment reminder SaaS designed to help local businesses track payments and trigger automated, system-driven WhatsApp payment notifications. 

Phase 1 focus is a high-fidelity client frontend with mock database syncing to local storage, supporting mobile-first layout designs, dark glassmorphism styling, and robust ledger math rules.

---

## 🛠 Tech Stack (Frontend Client)
* **Framework**: React 19 (via Vite)
* **Styling**: Tailwind CSS v4 (Glassmorphism design system)
* **Icons**: Lucide React
* **State Management**: React Context (`AppContext.jsx` syncing automatically to `localStorage` v3)
* **Routing**: React Router DOM v6

---

## 🌟 Key Features Implemented

### 1. Unified Dashboard & Filter Controls
* **Metrics Board**: Displaying **Total Members**, **Active / Paid** members count, **Overdue Fees**, and **Monthly Collected** revenue (current calendar month sum) alongside MRR estimations and All-time Ledger balance totals.
* **Interactive Shortcuts**:
  * Clicking the **Total Members** card opens a read-only **Members Directory modal** showing Name, Phone, and Joining Date. It includes an inline **real-time search** input to filter members.
  * Clicking **Active / Paid** or **Overdue Fees** cards acts as shortcut buttons to apply the corresponding list filters.
* **Fuzzy Search & Filters**: Filter members by All, Active, Overdue, and Inactive tabs, or search across names and numbers instantly.

### 2. Billing Registration & Grace Periods
* **Unpaid Member Toggle**: Allow registering new members as "Unpaid" on joining.
  * Snaps `nextDueDate` directly to their joining date (immediate payment required).
  * Skips adding ledger transactions (until they actually pay).
  * Gives managers a manual input override to delay their due date by a few days (grace period) if needed.
* **Tier-Based Auto-calculation**: Snaps dues automatically to +30 days (Monthly), +90 days (Quarterly), or +365 days (Yearly) when adding standard pre-paid accounts.

### 3. Immutable Accounting Ledger & Reversals
* **Preservation Rule**: Deleting a member from the registry keeps their payment history fully intact inside the accounting ledger for auditor records.
* **Error Correction Reversals**: Accidentally checking a payment or tier renewal can be undone via an inline **Undo** button (`RotateCcw`) next to the member.
  * Rolls back the member's due date by subscription tier intervals (`-30`/`-90`/`-365` days).
  * Logs a balancing negative ledger entry (`-₹Amount`, note: `REVERSAL: Error correction...`).
  * The Undo arrow dynamically follows sequential payment stacks (e.g. undoing early renewals back to the initial registration payment one after the other).
* **Ledger Search**: Search payment logs in the Accounting Ledger modal by member name.

### 4. System-Driven WhatsApp Previews & UPI Settings
* **Business Branding**: Customize business name, WhatsApp contact, UPI ID, and upload custom payment QR Codes (converted locally to base64 data).
* **Live WhatsApp Chat Bubble Preview**: Displays a visual preview bubble of the outgoing text ping.
  * If a QR code is uploaded, it previews as a top media attachment card.
  * Embeds markdown formatting (e.g., `*bold text*` blocks) and dynamic mappings (`businessName`, `upiId`) in real-time.
* **Template Guardrail**: The raw template configuration textarea is locked to prevent custom edits, ensuring strict, automated, system-only message flows.
* **Reminder Frequency Rules**: Choose between Standard (on due date, overdue 3, 7, and 10 days) and Aggressive (on due date, overdue 1, 3, then every 3 days) alert schedules.

### 5. SaaS Owner Billing, Pricing Plans & Lockouts
* **Dynamic Pricing Tiers**: App pricing plans scale dynamically based on the owner's active member count (Starter Plan at ₹999/mo; Growth Plan at ₹1,499/mo).
* **Limit Block Warnings**: Trying to add the 201st member under the Starter Plan locks out the registration form inside `AddMemberModal.jsx`, showing a locked upgrade dialog prompt directing owners to billing.
* **Automated Expiry checking**: background checker dynamically verifies `subscriptionDueDate` on mount/modifications, degrading status to overdue (calculating grace days left) or locking dashboard with suspended screens automatically. Auto-unlocks once payment completes.
* **Single-Gym & Multi-Gym Switcher Details**: Details single-gym constraints in the billing dashboard and presents the future multi-gym switcher scaling metrics (₹799/mo per additional location switch).
* **App Creator Billing tab**: Split profile page into a sidebar/tab structure ("Collections Config" and "App Creator Billing & Plan"). The billing tab shows active plans, status tags, manual payment triggers, and billing receipt logs.
* **SaaS Checkout Modal (`OwnerPayModal`)**: Reusable portal allowing owners to scan your custom UPI QR code or transfer to your configured UPI ID to pay and instantly unlock their accounts.
* **Developer Payment Configurations**: A dedicated administrator control panel in the App Creator Billing tab that enables you (Navneet Nihal Lakra) to dynamically update your UPI ID and upload a custom QR Code image (stored as Base64 in `localStorage`), instantly updating the checkout payment modal coordinates.
* **Simulation Control Panel**: Panel on the Profile Billing tab that allows developers and reviewers to switch the user subscription state instantly between `'active'`, `'overdue'`, and `'revoked'` or **Fill 200 Mock Members** to verify warning popups, locks, and warning overlays in real-time.

### 6. SSO Login Card & Creator Portal
* **Credentials Greeting**: Custom Username input pre-fills a dashboard welcome message (e.g., "Welcome back, Navneet").
* **Mock Auth Integrations**: High-end styling and instant navigation triggers for Google and Apple SSO sign-in options.
* **App Creator Login Tab**: Toggle between Gym Owner and App Creator credentials. No signup options for owners; secure administrative access with credentials `Nihal` + `creator123`.
* **Creator Portal Dashboard**: Once logged in as Creator, displays platform stats (total ARR, active subscribers, growth plan upgrades) and a **non-editable profile coordinate display** (extracting Navneet Nihal Lakra's configured UPI ID and QR code). Includes a searchable **Gym client subscription registry** allowing the creator to manage pricing tiers (Starter vs Growth) or access status flags (Active, Overdue, Revoked) for clients dynamically.

---

## 📂 Folder Structure

```text
├── README.md               # Main Workspace Overview & Run Instructions
└── frontend/               # React Vite Tailwind Client
    ├── src/
    │   ├── assets/         # App logos and illustrations
    │   ├── components/     # Modals (AddMember, Settings, OwnerPayModal), Members Tables
    │   ├── context/        # AppContext (Ledger logic, storage sync)
    │   ├── pages/          # Login, Dashboard, Profile Page
    │   ├── index.css       # Tailwind config & CSS custom variables
    │   └── main.jsx        # App mounting entry point
    ├── vite.config.js      # Build configurations & Tailwind plugins
    └── package.json        # Dependencies list
```

---

## 🚀 Running the App Locally

### 📦 Prerequisites
Install [Node.js](https://nodejs.org) (v18 or higher recommended).

### 🏃 Setup Commands
1. Navigate into the frontend project root:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the hot-reloading development server:
   ```bash
   npm run dev
   ```
4. Build client for production:
   ```bash
   npm run build
   ```
