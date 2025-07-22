const webhookService = require('../services/webhookService');

exports.handleShopifyOrderWebhook = async (req, res, next) => {
  try {
    const shopifyOrder = req.body;
    
    console.log('Shopify webhook received:', {
      order_id: shopifyOrder.id,
      order_number: shopifyOrder.order_number,
      email: shopifyOrder.email,
      financial_status: shopifyOrder.financial_status,
      fulfillment_status: shopifyOrder.fulfillment_status
    });

    // Validate required fields
    if (!shopifyOrder.created_at || !shopifyOrder.customer || !shopifyOrder.line_items || !shopifyOrder.order_number) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: created_at, customer, line_items, or order_number'
      });
    }

    // Process the webhook
    const result = await webhookService.processShopifyOrder(shopifyOrder);

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      data: {
        order_id: result.order_id,
        order_number: result.order_number,
        customer_id: result.customer_id,
        shipping_details_id: result.shipping_details_id
      }
    });

  } catch (err) {
    console.error('Error processing Shopify webhook:', err);
    
    // Return 200 to acknowledge receipt even if processing fails
    // This prevents Shopify from retrying the webhook
    res.status(200).json({
      success: false,
      error: 'Webhook received but processing failed',
      details: err.message
    });
  }
};

exports.handleShopifyOrderUpdate = async (req, res, next) => {
  try {
    const shopifyOrder = req.body;
    
    console.log('Shopify order update webhook received:', {
      order_id: shopifyOrder.id,
      order_number: shopifyOrder.order_number,
      fulfillment_status: shopifyOrder.fulfillment_status
    });

    // Update the order
    const result = await webhookService.updateShopifyOrder(shopifyOrder);

    res.status(200).json({
      success: true,
      message: 'Order update processed successfully',
      data: result
    });

  } catch (err) {
    console.error('Error processing Shopify order update:', err);
    res.status(200).json({
      success: false,
      error: 'Order update received but processing failed',
      details: err.message
    });
  }
};

exports.handleShopifyOrderCancellation = async (req, res, next) => {
  try {
    const shopifyOrder = req.body;
    
    console.log('Shopify order cancellation webhook received:', {
      order_id: shopifyOrder.id,
      order_number: shopifyOrder.order_number,
      cancel_reason: shopifyOrder.cancel_reason
    });

    // Cancel the order
    const result = await webhookService.cancelShopifyOrder(shopifyOrder);

    res.status(200).json({
      success: true,
      message: 'Order cancellation processed successfully',
      data: result
    });

  } catch (err) {
    console.error('Error processing Shopify order cancellation:', err);
    res.status(200).json({
      success: false,
      error: 'Order cancellation received but processing failed',
      details: err.message
    });
  }
};

// Health check for webhook endpoint
exports.webhookHealth = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Webhook endpoint is healthy',
    timestamp: new Date().toISOString()
  });
}; 