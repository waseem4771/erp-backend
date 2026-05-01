// const express = require('express');
// const router = express.Router();

// /**
//  * Controller & Middleware Imports
//  */
// const {
//     createProduct,
//     getProducts,
//     createWarehouse,
//     getStockReport,
//     createPurchaseOrder,
//     getPurchaseOrders,
//     receivePurchaseOrder,
//     adjustStock,    
//     getAllVariants,
//     transferStock // Added here ✅
// } = require('../controllers/inventoryController');

// // Importing the Security Middleware for RBAC Enforcement ✅
// const { checkPermission } = require('../middleware/rbacMiddleware');

// /**
//  * MODULE PROTECTION: Inventory
//  * Every route below is guarded by the RBAC middleware.
//  * Verification: Checks the database for 'Inventory' module view/edit rights.
//  */

// // --- 1. PRODUCT & SKU CATALOG MANAGEMENT ---
// // Register new items and fetch unit-specific product lists
// router.post('/products', checkPermission('Inventory'), createProduct); 
// router.get('/products', checkPermission('Inventory'), getProducts);   


// // --- 2. VARIANTS & SEARCH UTILITIES ---
// // Retrieve all variants with SBU-specific pricing for dropdowns
// router.get('/all-variants', checkPermission('Inventory'), getAllVariants); 


// // --- 3. WAREHOUSES & MULTI-SITE CONFIGURATION ---
// // Manage physical or digital storage locations
// router.post('/warehouses', checkPermission('Inventory'), createWarehouse); 


// // --- 4. STOCK & INVENTORY INTELLIGENCE ---
// // Real-time stock levels and warehouse-wise reporting
// router.get('/stock-report', checkPermission('Inventory'), getStockReport); 


// // --- 5. PROCUREMENT (PURCHASE REQUISITIONS) ---
// // Manage the procurement lifecycle from PO creation to stock receiving
// router.post('/purchase-order', checkPermission('Inventory'), createPurchaseOrder);   
// router.get('/purchase-report', checkPermission('Inventory'), getPurchaseOrders);
// router.post('/receive-po', checkPermission('Inventory'), receivePurchaseOrder);       


// // --- 6. INVENTORY ADJUSTMENTS (WASTE CONTROL) ---
// // Logic for handling Damaged, Lost, or Expired stock deductions
// router.post('/adjust', checkPermission('Inventory'), adjustStock);


// // --- 7. STOCK TRANSFERS (NEW ✅) ---
// // Logic for moving stock between warehouses or units
// router.post('/transfer', checkPermission('Inventory'), transferStock);


// module.exports = router;





const express = require('express');
const router = express.Router();

/**
 * Controller & Middleware Imports
 */
const {
    createProduct,
    getProducts,
    createWarehouse,
    getWarehouses, // Imported for the listing endpoint ✅
    getStockReport,
    createPurchaseOrder,
    getPurchaseOrders,
    receivePurchaseOrder,
    adjustStock,    
    getAllVariants,
    transferStock 
} = require('../controllers/inventoryController');

// Importing Security & Validation Middlewares ✅
const { checkPermission } = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validateMiddleware');
const schemas = require('../utils/validationSchemas');

/**
 * MODULE PROTECTION: Inventory
 * Every route below is guarded by RBAC middleware and Zod Data Validation. ✅
 */

// --- 1. PRODUCT & SKU CATALOG MANAGEMENT ---
router.post(
    '/products', 
    checkPermission('Inventory'), 
    validate(schemas.inventoryProduct), 
    createProduct
); 

router.get(
    '/products', 
    checkPermission('Inventory'), 
    validate(schemas.sbuIdQuery), 
    getProducts
);   


// --- 2. VARIANTS & SEARCH UTILITIES ---
router.get(
    '/all-variants', 
    checkPermission('Inventory'), 
    validate(schemas.sbuIdQuery), 
    getAllVariants
); 


// --- 3. WAREHOUSES & MULTI-SITE CONFIGURATION ---
router.post(
    '/warehouses', 
    checkPermission('Inventory'), 
    validate(schemas.inventoryWarehouse), 
    createWarehouse
); 

// Endpoint to retrieve the list of all registered warehouses/sites ✅
router.get(
    '/warehouses', 
    checkPermission('Inventory'), 
    validate(schemas.sbuIdQuery), 
    getWarehouses
);


// --- 4. STOCK & INVENTORY INTELLIGENCE ---
router.get(
    '/stock-report', 
    checkPermission('Inventory'), 
    validate(schemas.sbuIdQuery), 
    getStockReport
); 


// --- 5. PROCUREMENT (PURCHASE REQUISITIONS) ---
router.post(
    '/purchase-order', 
    checkPermission('Inventory'), 
    validate(schemas.inventoryPO), 
    createPurchaseOrder
);   

router.get(
    '/purchase-report', 
    checkPermission('Inventory'), 
    validate(schemas.sbuIdQuery), 
    getPurchaseOrders
);

router.post(
    '/receive-po', 
    checkPermission('Inventory'), 
    validate(schemas.inventoryReceivePO), 
    receivePurchaseOrder
);       


// --- 6. INVENTORY ADJUSTMENTS (WASTE CONTROL) ---
router.post(
    '/adjust', 
    checkPermission('Inventory'), 
    validate(schemas.inventoryAdjust), 
    adjustStock
);


// --- 7. STOCK TRANSFERS ---
router.post(
    '/transfer', 
    checkPermission('Inventory'), 
    validate(schemas.inventoryTransfer), 
    transferStock
);


module.exports = router;