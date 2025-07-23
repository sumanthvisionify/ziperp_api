const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Shopify order webhooks - these will work with your current URL
router.post('/shopify/orders/create', webhookController.handleShopifyOrderWebhook);
router.post('/shopify/orders/updated', webhookController.handleShopifyOrderUpdate);
router.post('/shopify/orders/cancelled', webhookController.handleShopifyOrderCancellation);

// Alternative webhook routes (if needed)
router.post('/orders/create', webhookController.handleShopifyOrderWebhook);
router.post('/orders/updated', webhookController.handleShopifyOrderUpdate);
router.post('/orders/cancelled', webhookController.handleShopifyOrderCancellation);

module.exports = router;