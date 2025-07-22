const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Shopify order webhooks
router.post('/shopify/orders/create', webhookController.handleShopifyOrderWebhook);
router.post('/shopify/orders/updated', webhookController.handleShopifyOrderUpdate);
router.post('/shopify/orders/cancelled', webhookController.handleShopifyOrderCancellation);

// Legacy route for backward compatibility
router.post('/orders/create', webhookController.handleShopifyOrderWebhook);

module.exports = router;