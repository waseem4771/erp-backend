const express = require('express');
const router = express.Router();

/**
 * Controller & Middleware Imports
 */
const { captureWebLead } = require('../controllers/webTrackingController');

// Importing the API Key Verification Middleware for external site security
const verifyExternalApiKey = require('../middleware/externalAuth');

/**
 * WEB TRACKING GATEWAY
 * Purpose: Secure inbound endpoints for external platforms to push leads into the ERP CRM.
 * Security: Every request must include 'x-client-id' and 'x-secret-key' in the headers.
 */

/**
 * POST: External Lead Capture
 * Endpoint: http://localhost:5000/api/tracking/capture
 * Integration: Hits from WordPress, Shopify, MERN, or Mobile Apps.
 * Logic: Automatically identifies the SBU via the provided API credentials.
 */
router.post('/capture', verifyExternalApiKey, captureWebLead);

module.exports = router;