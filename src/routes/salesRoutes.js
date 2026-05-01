// const express = require('express');
// const router = express.Router();

// /**
//  * Controller & Middleware Imports
//  */
// const { 
//     createCustomer, 
//     getCustomers, 
//     createOrder,
//     getOrders,        
//     deleteOrder,      
//     createQuote,
//     getQuotes,
//     convertQuoteToOrder 
// } = require('../controllers/salesController');

// // Importing the Security Middleware for Permission Enforcement ✅
// const { checkPermission } = require('../middleware/rbacMiddleware');

// /**
//  * MODULE PROTECTION: Sales
//  * Every route below is now guarded by the RBAC middleware.
//  * Logic: Checks the 'permissions' table for the 'Sales' module access.
//  */

// // --- 1. CUSTOMER ENTITY MANAGEMENT ---
// // Create and view customers linked to the Strategic Business Unit
// router.post('/customers', checkPermission('Sales'), createCustomer); 
// router.get('/customers', checkPermission('Sales'), getCustomers);   


// // --- 2. SALES ORDER & INVOICE OPERATIONS ---
// // Process new orders and manage historical billing data
// router.post('/orders', checkPermission('Sales'), createOrder);       
// router.get('/orders', checkPermission('Sales'), getOrders);         
// // Route: DELETE http://localhost:5000/api/sales/orders/:id
// router.delete('/orders/:id', checkPermission('Sales'), deleteOrder); 


// // --- 3. QUOTATIONS & PROPOSALS ---
// // Generate business proposals/quotes for potential clients
// router.post('/quotes', checkPermission('Sales'), createQuote);       
// router.get('/quotes', checkPermission('Sales'), getQuotes);         


// // --- 4. SALES CONVERSION LOGIC ---
// // Converts a 'Draft' quote into a finalized 'Invoiced' sales order
// router.post('/convert-quote', checkPermission('Sales'), convertQuoteToOrder); 

// module.exports = router;







const express = require('express');
const router = express.Router();

/**
 * Controller & Middleware Imports
 */
const { 
    createCustomer, 
    getCustomers, 
    createOrder,
    getOrders,        
    deleteOrder,      
    createQuote,
    getQuotes,
    convertQuoteToOrder 
} = require('../controllers/salesController');

// Importing Security & Validation Middlewares ✅
const { checkPermission } = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validateMiddleware');
const schemas = require('../utils/validationSchemas');

/**
 * MODULE PROTECTION: Sales
 * Every route below is now guarded by RBAC middleware and Data Validation. ✅
 * Logic: Checks the 'permissions' table for the 'Sales' module access and ensures data integrity.
 */

// --- 1. CUSTOMER ENTITY MANAGEMENT ---
// Create and view customers linked to the Strategic Business Unit
router.post(
    '/customers', 
    checkPermission('Sales'), 
    validate(schemas.salesCustomer), 
    createCustomer
); 

router.get(
    '/customers', 
    checkPermission('Sales'), 
    validate(schemas.sbuIdQuery), 
    getCustomers
);   


// --- 2. SALES ORDER & INVOICE OPERATIONS ---
// Process new orders and manage historical billing data
router.post(
    '/orders', 
    checkPermission('Sales'), 
    validate(schemas.salesOrder), 
    createOrder
);       

router.get(
    '/orders', 
    checkPermission('Sales'), 
    validate(schemas.sbuIdQuery), 
    getOrders
);         

// Route: DELETE http://localhost:5000/api/sales/orders/:id
router.delete(
    '/orders/:id', 
    checkPermission('Sales'), 
    deleteOrder
); 


// --- 3. QUOTATIONS & PROPOSALS ---
// Generate business proposals/quotes for potential clients
router.post(
    '/quotes', 
    checkPermission('Sales'), 
    validate(schemas.salesQuote), 
    createQuote
);       

router.get(
    '/quotes', 
    checkPermission('Sales'), 
    validate(schemas.sbuIdQuery), 
    getQuotes
);         


// --- 4. SALES CONVERSION LOGIC ---
// Converts a 'Draft' quote into a finalized 'Invoiced' sales order
router.post(
    '/convert-quote', 
    checkPermission('Sales'), 
    validate(schemas.salesConvertQuote), 
    convertQuoteToOrder
); 

module.exports = router;