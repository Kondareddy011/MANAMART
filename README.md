# MANAMART - Community Grocery Survey & Admin Portal

Hyperlocal supply chain initiative for apartment communities and gated societies to aggregate demand and source groceries directly from farm and wholesale mandis.

---

## 🌟 Features

- **Resident Grocery Survey (`index.html`)**:
  - Interactive questionnaire capturing community monthly staple, dairy, and grocery preferences.
  - Estimated budget calculation and bulk savings insights.
  - WhatsApp share button for society group chats.
  - Dual cloud synchronization with Turso (libSQL) and Firebase Cloud Firestore with offline fallback.

- **Wholesaler Quotation Submission**:
  - Procurement quotation portal for mandi vendors, grain merchants, and dairy suppliers.
  - MOQ, pricing, delivery radius, and return SLA tracking.

- **Admin Analytics Dashboard (`admin.html`)**:
  - Live analytics and aggregate monthly demand by commodity.
  - Society/Apartment breakdown and individual response viewer.
  - Data export to CSV, JSON, and print-ready reports.
  - Database management tools for Turso and Firebase.

---

## 🚀 Live Access via GitHub Pages

To make the survey accessible to residents on any phone or computer:

1. In this repository, go to **Settings** > **Pages** (in the left sidebar).
2. Under **Build and deployment** > **Source**, select **Deploy from a branch**.
3. Choose branch: **`main`** and folder: **`/ (root)`**.
4. Click **Save**.
5. Your live link will be generated: `https://kondareddy011.github.io/MANAMART/`

---

## 📁 Project Structure

```
MANAMART/
├── index.html            # Main Resident & Wholesaler Survey Portal
├── admin.html            # Admin Analytics & Response Management Dashboard
├── css/
│   ├── survey.css        # Survey UI styling and responsive layouts
│   └── admin.css         # Admin portal styling, charts, and tables
└── js/
    ├── survey.js         # Survey validation, form handlers, and calculations
    ├── admin.js          # Admin dashboard charts, table filters, and exports
    ├── turso-config.js   # Turso libSQL serverless database client
    └── firebase-config.js# Firebase Cloud Firestore real-time sync
```

---

## 💻 Local Preview

Run a simple local web server:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve
```
Then visit `http://localhost:8000` in your browser.
