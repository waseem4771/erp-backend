//------------------------------- Backend ------------------------------------------

vimal-erp-backend/
├── prisma/
│   └── schema.prisma           # Core Database Schema (MySQL + Prisma Client)
├── src/
│   ├── controllers/            # BUSINESS INTELLIGENCE (Logic & Calculations)
│   │   ├── agingController.js          # AR/AP Debt & Liability Buckets (30/60/90 days)
│   │   ├── apiKeysController.js        # Secure B2B Client ID & Secret Key Generation
│   │   ├── authController.js           # Bcrypt Hashing, Signup & SBU-based Login
│   │   ├── cashFlowController.js       # Automated Inflow/Outflow Ledger Analysis
│   │   ├── crmController.js            # Lead Scoring, CRM Registry & Campaign Tracking
│   │   ├── currencyController.js       # Global Exchange Rate Management
│   │   ├── dashboardController.js      # Mother Dashboard Summary & Audit Trail Sync
│   │   ├── expenseController.js        # Operating Costs & Digital Receipt Processing
│   │   ├── externalController.js       # External Order Sync & Price Book Inquiries
│   │   ├── financialController.js      # P&L, Balance Sheet & Trial Balance Engines
│   │   ├── fixedAssetsController.js    # Asset Lifecycle & Depreciation Calculations
│   │   ├── fundController.js           # Capital Allocation & Automated Profit Sharing
│   │   ├── hrAttendanceController.js   # Daily Presence & Leave Approval Workflows
│   │   ├── hrController.js             # Workforce Directory & Automated Payroll Logic
│   │   ├── hrReportController.js       # Departmental Salary Cost Center Analytics
│   │   ├── inventoryController.js      # Multi-site Stock, Products & SKU Management
│   │   ├── pricingController.js        # SBU-Specific Price Books & Promo Logic
│   │   ├── procurementController.js    # Authorization Threshold Logic ($1,000 Rules)
│   │   ├── reconciliationController.js # Bank Statement & Ledger Matching Engine
│   │   ├── sbuController.js            # Unit Configuration & Automated CoA Setup
│   │   ├── sbuReportController.js      # Independent Unit Performance Metrics
│   │   └── webTrackingController.js    # Inbound Web Lead Capture API
│   │
│   ├── routes/                 # API GATEWAY (System Endpoints)
│   │   ├── analyticsRoutes.js      # /api/analytics (Financial & BI Reports)
│   │   ├── apiKeysRoutes.js        # /api/keys (B2B Credential Management)
│   │   ├── authRoutes.js           # /api/auth (Identity Access)
│   │   ├── crmRoutes.js            # /api/crm (Marketing & Leads)
│   │   ├── currencyRoutes.js       # /api/currencies (Exch. Rate Settings)
│   │   ├── expenseRoutes.js        # /api/expenses (Disbursement Entry)
│   │   ├── externalRoutes.js       # /api/external (B2B Marketplace Sync)
│   │   ├── fixedAssetsRoutes.js    # /api/fixed-assets (Asset Registry)
│   │   ├── fundRoutes.js           # /api/funds (Capital & Profit Management)
│   │   ├── hrAttendanceRoutes.js   # /api/hr-attendance (Presence & Leaves)
│   │   ├── hrRoutes.js             # /api/hr (Employees & Payroll)
│   │   ├── inventoryRoutes.js      # /api/inventory (Operational Hub)
│   │   ├── pricingRoutes.js        # /api/pricing (Discounts & Price Books)
│   │   ├── procurementRoutes.js    # /api/procurement (Approval Workflows)
│   │   ├── salesRoutes.js          # /api/sales (Invoices, Orders & Quotes)
│   │   ├── sbuRoutes.js            # /api/settings/sbus (Unit Configuration)
│   │   └── webTrackingRoutes.js    # /api/tracking (External Form Integration)
│   │
│   ├── middleware/             # SECURITY ENFORCEMENT
│   │   ├── rbacMiddleware.js       # Internal Role-Based Access Control (RBAC)
│   │   └── externalAuth.js         # B2B API Key Handshake & Inbound Logging
│   │
│   └── utils/                  # CORE HELPERS & AUTOMATION
│       ├── auditHelper.js          # Multi-Tenant Immutable Action Logger
│       └── ledgerHelper.js         # Dynamic SBU Financial Posting Engine ✅
│
├── uploads/                    # Secure Storage (Invoices & Compliance Docs)
├── .env                        # Environment Secrets (DB_URL, PORT, JWT_SECRET)
├── package.json                # Dependencies (Express, Prisma, Bcrypt, Multer)
└── server.js                   # CENTRAL HUB (Module Registration & App Start)