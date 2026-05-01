// const express = require('express');
// const cors = require('cors');
// const { PrismaClient } = require('@prisma/client');
// const path = require('path');
// require('dotenv').config();

// // AUTOMATION ENGINE IMPORT ✅
// const { initProfitScheduler } = require('./src/utils/profitScheduler');

// /**
//  * VIMAL ERP - CENTRAL HUB (Backend Engine)
//  * Purpose: Integrates all 17 business modules and manages automated fiscal tasks.
//  * Update: Initialized Monthly Profit Sharing Scheduler. ✅
//  */

// // 1. CORE ROUTE IMPORTS
// const authRoutes = require('./src/routes/authRoutes'); 
// const inventoryRoutes = require('./src/routes/inventoryRoutes');
// const salesRoutes = require('./src/routes/salesRoutes'); 
// const hrRoutes = require('./src/routes/hrRoutes'); 
// const hrAttendanceRoutes = require('./src/routes/hrAttendanceRoutes');
// const crmRoutes = require('./src/routes/crmRoutes'); 
// const procurementRoutes = require('./src/routes/procurementRoutes');
// const externalRoutes = require('./src/routes/externalRoutes'); 
// const apiKeysRoutes = require('./src/routes/apiKeysRoutes');   
// const analyticsRoutes = require('./src/routes/analyticsRoutes');
// const fixedAssetsRoutes = require('./src/routes/fixedAssetsRoutes'); 
// const currencyRoutes = require('./src/routes/currencyRoutes');
// const fundRoutes = require('./src/routes/fundRoutes');
// const pricingRoutes = require('./src/routes/pricingRoutes');
// const expenseRoutes = require('./src/routes/expenseRoutes');
// const webTrackingRoutes = require('./src/routes/webTrackingRoutes');
// const sbuRoutes = require('./src/routes/sbuRoutes');

// const prisma = new PrismaClient();
// const app = express();

// /**
//  * 2. GLOBAL MIDDLEWARE & CORS CONFIGURATION
//  */
// app.use(cors({
//     origin: process.env.FRONTEND_URL || "*", 
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//     allowedHeaders: [
//         "Content-Type", 
//         "Authorization", 
//         "x-user-id",    
//         "x-client-id",  
//         "x-secret-key"  
//     ]
// }));

// app.use(express.json()); 

// /**
//  * 3. STATIC ASSETS SERVING
//  */
// app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 

// /**
//  * 4. ROUTE REGISTRATION (Multi-Module Architecture)
//  */

// // A. ACCESS CONTROL & IDENTITY
// app.use('/api/auth', authRoutes);

// // B. OPERATIONS & SUPPLY CHAIN
// app.use('/api/inventory', inventoryRoutes);
// app.use('/api/procurement', procurementRoutes);
// app.use('/api/fixed-assets', fixedAssetsRoutes);

// // C. SALES, QUOTES & PRICING
// app.use('/api/sales', salesRoutes);
// app.use('/api/pricing', pricingRoutes);

// // D. HUMAN RESOURCES & PAYROLL
// app.use('/api/hr', hrRoutes);
// app.use('/api/hr-attendance', hrAttendanceRoutes);

// // E. FINANCE, CAPITAL & UNIT SETTINGS
// app.use('/api/funds', fundRoutes);
// app.use('/api/currencies', currencyRoutes);
// app.use('/api/expenses', expenseRoutes);
// app.use('/api/settings/sbus', sbuRoutes);

// // F. MARKETING & EXTERNAL INBOUNDS
// app.use('/api/crm', crmRoutes);
// app.use('/api/tracking', webTrackingRoutes);

// // G. BUSINESS INTELLIGENCE (ANALYTICS)
// app.use('/api/analytics', analyticsRoutes);

// // H. EXTERNAL B2B GATEWAY
// app.use('/api/external', externalRoutes);
// app.use('/api/keys', apiKeysRoutes);


// /**
//  * 5. CORE SYSTEM DIAGNOSTICS & AUTOMATION START ✅
//  */

// // INITIALIZE AUTOMATED FISCAL SCHEDULER (Monthly Profit Sharing)
// initProfitScheduler(); 

// app.get('/api/status', async (req, res) => {
//     try {
//         const sbuCount = await prisma.sbus.count();
//         const userCount = await prisma.users.count();
//         res.json({ 
//             status: "Online",
//             message: "Vimal ERP Centralized Hub is fully Operational! 🚀", 
//             automation: "Profit Sharing Scheduler Active ✅",
//             total_sbus: sbuCount, 
//             total_users: userCount,
//             environment: process.env.NODE_ENV || "Development"
//         });
//     } catch (error) {
//         res.status(500).json({ error: "System Diagnostic Error: " + error.message });
//     }
// });

// app.get('/api/accounts', async (req, res) => {
//     try {
//         const accounts = await prisma.chart_of_accounts.findMany({
//             orderBy: { account_code: 'asc' }
//         });
//         res.json(accounts);
//     } catch (error) {
//         res.status(500).json({ error: "Database Link Error." });
//     }
// });

// app.get('/', (req, res) => {
//     res.send("Vimal ERP API Gateway: 17 core modules + Automation Engine synchronized. 🚀");
// });


// /**
//  * 6. PRODUCTION SERVER LISTENER
//  */
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`\n=================================================`);
//     console.log(`🚀 VIMAL ERP Backend: http://localhost:${PORT}`);
//     console.log(`🤖 Automation: Monthly Profit Sharing Engine LIVE`);
//     console.log(`📡 Environment: ${process.env.NODE_ENV || 'Production'}`);
//     console.log(`🛡️  CORS Policy: Restricted to ${process.env.FRONTEND_URL || 'All Origins'}`);
//     console.log(`=================================================\n`);
// });






const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config();

// AUTOMATION ENGINE IMPORT ✅
const { initProfitScheduler } = require('./src/utils/profitScheduler');

/**
 * VIMAL ERP - CENTRAL HUB (Backend Engine)
 * Purpose: Integrates all 17 business modules and manages automated fiscal tasks.
 * Update: Reconfigured CORS to allow External API/Webhook integrations securely. ✅
 */

// 1. CORE ROUTE IMPORTS
const authRoutes = require('./src/routes/authRoutes'); 
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const salesRoutes = require('./src/routes/salesRoutes'); 
const hrRoutes = require('./src/routes/hrRoutes'); 
const hrAttendanceRoutes = require('./src/routes/hrAttendanceRoutes');
const crmRoutes = require('./src/routes/crmRoutes'); 
const procurementRoutes = require('./src/routes/procurementRoutes');
const externalRoutes = require('./src/routes/externalRoutes'); 
const apiKeysRoutes = require('./src/routes/apiKeysRoutes');   
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const fixedAssetsRoutes = require('./src/routes/fixedAssetsRoutes'); 
const currencyRoutes = require('./src/routes/currencyRoutes');
const fundRoutes = require('./src/routes/fundRoutes');
const pricingRoutes = require('./src/routes/pricingRoutes');
const expenseRoutes = require('./src/routes/expenseRoutes');
const webTrackingRoutes = require('./src/routes/webTrackingRoutes');
const sbuRoutes = require('./src/routes/sbuRoutes');

const prisma = new PrismaClient();
const app = express();

/**
 * 2. GLOBAL MIDDLEWARE & CORS CONFIGURATION
 * Fix: Configured to support both internal Next.js requests and External Webhooks (HTML/Shopify). ✅
 */
app.use(cors({
    origin: "*", // Enables Cross-Origin requests from external platforms (e.g., HTML forms, MERN, Shopify)
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
        "Content-Type", 
        "Authorization", 
        "x-user-id",    
        "x-client-id",  // Allows external Gateway Identity
        "x-secret-key"  // Allows external Gateway Secret
    ]
}));

app.use(express.json()); 

/**
 * 3. STATIC ASSETS SERVING
 */
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 

/**
 * 4. ROUTE REGISTRATION (Multi-Module Architecture)
 */

// A. ACCESS CONTROL & IDENTITY
app.use('/api/auth', authRoutes);

// B. OPERATIONS & SUPPLY CHAIN
app.use('/api/inventory', inventoryRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/fixed-assets', fixedAssetsRoutes);

// C. SALES, QUOTES & PRICING
app.use('/api/sales', salesRoutes);
app.use('/api/pricing', pricingRoutes);

// D. HUMAN RESOURCES & PAYROLL
app.use('/api/hr', hrRoutes);
app.use('/api/hr-attendance', hrAttendanceRoutes);

// E. FINANCE, CAPITAL & UNIT SETTINGS
app.use('/api/funds', fundRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settings/sbus', sbuRoutes);

// F. MARKETING & EXTERNAL INBOUNDS
app.use('/api/crm', crmRoutes);
app.use('/api/tracking', webTrackingRoutes);

// G. BUSINESS INTELLIGENCE (ANALYTICS)
app.use('/api/analytics', analyticsRoutes);

// H. EXTERNAL B2B GATEWAY
app.use('/api/external', externalRoutes);
app.use('/api/keys', apiKeysRoutes);


/**
 * 5. CORE SYSTEM DIAGNOSTICS & AUTOMATION START ✅
 */

// INITIALIZE AUTOMATED FISCAL SCHEDULER (Monthly Profit Sharing)
initProfitScheduler(); 

app.get('/api/status', async (req, res) => {
    try {
        const sbuCount = await prisma.sbus.count();
        const userCount = await prisma.users.count();
        res.json({ 
            status: "Online",
            message: "Vimal ERP Centralized Hub is fully Operational! 🚀", 
            automation: "Profit Sharing Scheduler Active ✅",
            total_sbus: sbuCount, 
            total_users: userCount,
            environment: process.env.NODE_ENV || "Development"
        });
    } catch (error) {
        res.status(500).json({ error: "System Diagnostic Error: " + error.message });
    }
});

app.get('/api/accounts', async (req, res) => {
    try {
        const accounts = await prisma.chart_of_accounts.findMany({
            orderBy: { account_code: 'asc' }
        });
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: "Database Link Error." });
    }
});

app.get('/', (req, res) => {
    res.send("Vimal ERP API Gateway: 17 core modules + Automation Engine synchronized. 🚀");
});


/**
 * 6. PRODUCTION SERVER LISTENER
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 VIMAL ERP Backend: http://localhost:${PORT}`);
    console.log(`🤖 Automation: Monthly Profit Sharing Engine LIVE`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'Production'}`);
    console.log(`🛡️  CORS Policy: OPEN for External Marketplace Sync`);
    console.log(`=================================================\n`);
});