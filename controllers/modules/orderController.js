const orderService = require('../../services/modules/orderService');

exports.getAllOrders = async (req, res, next) => {
  try {
    const { 
      customer_id, 
      status, 
      factory_id, 
      start_date, 
      end_date,
      page = 1,
      limit = 20
    } = req.query;
    
    const filterParams = {};
    if (customer_id) filterParams.customer_id = customer_id;
    if (status) filterParams.status = status;
    if (factory_id) filterParams.factory_id = factory_id;
    if (start_date && end_date) {
      filterParams.start_date = start_date;
      filterParams.end_date = end_date;
    }
    
    const orders = await orderService.getAllOrders(filterParams);
    
    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedOrders = orders.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedOrders,
      pagination: {
        current_page: parseInt(page),
        total_records: orders.length,
        total_pages: Math.ceil(orders.length / limit),
        per_page: parseInt(limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }
    res.json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const currentUserId = req.user?.id;
    const newOrder = await orderService.createOrder(req.body, currentUserId);
    res.status(201).json({
      success: true,
      data: newOrder,
      message: 'Order created successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.updateOrder = async (req, res, next) => {
  try {
    const currentUserId = req.user?.id;
    const updatedOrder = await orderService.updateOrder(req.params.id, req.body, currentUserId);
    if (!updatedOrder) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }
    res.json({
      success: true,
      data: updatedOrder,
      message: 'Order updated successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const currentUserId = req.user?.id;
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        error: 'Status is required' 
      });
    }
    
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'shipped'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}` 
      });
    }
    
    const updatedOrder = await orderService.updateOrderStatus(req.params.id, status, currentUserId);
    res.json({
      success: true,
      data: updatedOrder,
      message: `Order status updated to ${status}`
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const currentUserId = req.user?.id;
    const deleted = await orderService.deleteOrder(req.params.id, currentUserId);
    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }
    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.getOrdersByCustomer = async (req, res, next) => {
  try {
    const orders = await orderService.getOrdersByCustomer(req.params.customerId);
    res.json({
      success: true,
      data: orders,
      count: orders.length
    });
  } catch (err) {
    next(err);
  }
};

exports.getOrdersByStatus = async (req, res, next) => {
  try {
    const orders = await orderService.getOrdersByStatus(req.params.status);
    res.json({
      success: true,
      data: orders,
      count: orders.length
    });
  } catch (err) {
    next(err);
  }
};

exports.getOrdersByFactory = async (req, res, next) => {
  try {
    const orders = await orderService.getOrdersByFactory(req.params.factoryId);
    res.json({
      success: true,
      data: orders,
      count: orders.length
    });
  } catch (err) {
    next(err);
  }
};

exports.getOrdersRequiringItems = async (req, res, next) => {
  try {
    const { factory_id } = req.query;
    const orderIngredients = await orderService.getOrdersRequiringItems(factory_id);
    res.json({
      success: true,
      data: orderIngredients,
      count: orderIngredients.length
    });
  } catch (err) {
    next(err);
  }
};

exports.getOrderAnalytics = async (req, res, next) => {
  try {
    const { start_date, end_date, factory_id } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ 
        success: false, 
        error: 'start_date and end_date are required' 
      });
    }
    
    const analytics = await orderService.getOrderAnalytics(start_date, end_date, factory_id);
    res.json({
      success: true,
      data: analytics
    });
  } catch (err) {
    next(err);
  }
};

// Bulk operations
exports.bulkUpdateOrderStatus = async (req, res, next) => {
  try {
    const { order_ids, status } = req.body;
    const currentUserId = req.user?.id;
    
    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'order_ids array is required' 
      });
    }
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        error: 'status is required' 
      });
    }
    
    const updatedOrders = [];
    const errors = [];
    
    for (const orderId of order_ids) {
      try {
        const updatedOrder = await orderService.updateOrderStatus(orderId, status, currentUserId);
        updatedOrders.push(updatedOrder);
      } catch (error) {
        errors.push({ order_id: orderId, error: error.message });
      }
    }
    
    res.json({
      success: true,
      data: {
        updated_orders: updatedOrders,
        errors: errors
      },
      message: `Bulk status update completed. ${updatedOrders.length} orders updated, ${errors.length} errors.`
    });
  } catch (err) {
    next(err);
  }
};

exports.createDummyOrders = async (req, res, next) => {
  try {
    const { numOrders = 5 } = req.body;
    const currentUserId = req.user?.id;
    
    if (numOrders < 1 || numOrders > 50) {
      return res.status(400).json({
        success: false,
        error: 'Number of orders must be between 1 and 50'
      });
    }
    
    const result = await orderService.createDummyOrders(numOrders, currentUserId);
    
    res.status(201).json({
      success: true,
      data: result,
      message: `Successfully created ${result.orders.length} dummy orders with ${result.orderDetails.length} order details and ${result.orderDetailIngredients.length} ingredients`
    });
  } catch (err) {
    next(err);
  }
};

exports.createSimplifiedOrder = async (req, res, next) => {
  try {
    const { 
      created_at,
      order_date,
      status,
      customer_details,
      customers,  // alternative field name
      factory_id,
      company_id,
      order_details 
    } = req.body;

    // Handle customer details from either field name
    const customerData = customer_details || customers;

    // Validate required fields with detailed messages
    const errors = [];

    if (!created_at && !order_date) {
      errors.push('Either created_at or order_date is required');
    }

    if (!customerData) {
      errors.push('Customer details are required (use either customer_details or customers field)');
    } else if (!customerData.email && !customerData.customers_email) {
      errors.push('Customer email is required (use either email or customers_email field)');
    }

    if (!order_details || !Array.isArray(order_details)) {
      errors.push('order_details must be an array');
    } else {
      // Validate each order detail
      order_details.forEach((detail, index) => {
        if (!detail.product_id) {
          errors.push(`product_id is required for order detail at index ${index}`);
        }
      });
    }

    // If there are validation errors, return them all at once
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        errors: errors
      });
    }

    // Transform the data to match our schema
    const transformedOrder = {
      order_date: order_date || new Date(created_at).toISOString().split('T')[0],
      status: status || 'pending',
      customer_details: {
        email: customerData.email || customerData.customers_email,
        name: customerData.name,
        status: customerData.status || 'active'
      },
      factory_id: factory_id || null,
      company_id: company_id || null,
      order_details: order_details.map(detail => ({
        ...detail,
        status: detail.status || 'pending'
      }))
    };

    const currentUserId = req.user?.id;
    const newOrder = await orderService.createOrder(transformedOrder, currentUserId);

    res.status(201).json({
      success: true,
      data: newOrder,
      message: 'Order created successfully'
    });
  } catch (err) {
    console.error('Error creating simplified order:', err);
    if (err.message === 'Email already exists') {
      res.status(409).json({ 
        success: false, 
        error: err.message 
      });
    } else {
      next(err);
    }
  }
};

/**
 * Creates an order from Shopify order data
 * Expected input format:
 * {
 *   "id": 820982911946154508,
 *   "email": "jon@doe.ca",
 *   "created_at": "2025-07-03T10:00:00-04:00",
 *   "updated_at": "2025-07-03T10:00:00-04:00",
 *   "order_number": 1001,
 *   "total_price": "199.99",
 *   "currency": "USD",
 *   "financial_status": "paid",
 *   "fulfillment_status": "unfulfilled",
 *   "customer": {
 *     "id": 207119551,
 *     "first_name": "Jon",
 *     "last_name": "Doe",
 *     "email": "jon@doe.ca"
 *   },
 *   "line_items": [
 *     {
 *       "id": 866550311766439020,
 *       "variant_id": 808950810,
 *       "title": "Custom Cushion",
 *       "quantity": 1,
 *       "price": "199.99",
 *       "sku": "CUSH-001",
 *       "vendor": "ZIPCushions"
 *     }
 *   ],
 *   "shipping_address": {
 *     "first_name": "Jon",
 *     "last_name": "Doe",
 *     "address1": "123 Elm St",
 *     "city": "Ottawa",
 *     "province": "Ontario",
 *     "country": "Canada",
 *     "zip": "K2P1L4"
 *   },
 *   "billing_address": {
 *     "first_name": "Jon",
 *     "last_name": "Doe",
 *     "address1": "123 Elm St",
 *     "city": "Ottawa",
 *     "province": "Ontario",
 *     "country": "Canada",
 *     "zip": "K2P1L4"
 *   },
 *   "note": "Please deliver between 3-5 PM.",
 *   "tags": "custom,urgent",
 *   "source_name": "web"
 * }
 * 
 * Fields that will be ignored:
 * - id (Shopify's order ID)
 * - currency
 * - financial_status
 * - shipping_address
 * - billing_address
 * - note
 * - tags
 * - source_name
 * - customer.id (Shopify's customer ID)
 * - line_items[].id (Shopify's line item ID)
 * - line_items[].variant_id
 * - line_items[].sku
 * - line_items[].vendor
 */
exports.createShopifyOrder = async (req, res, next) => {
  try {
    const shopifyOrder = req.body;

    // Basic validation
    if (!shopifyOrder.created_at || !shopifyOrder.customer || !shopifyOrder.line_items || !shopifyOrder.order_number) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: created_at, customer, line_items, or order_number'
      });
    }

    // Transform customer data
    const customerData = {
      name: `${shopifyOrder.customer.first_name} ${shopifyOrder.customer.last_name}`.trim(),
      email: shopifyOrder.customer.email,
      status: 'active'
    };

    // Map fulfillment status to our status
    const statusMap = {
      'unfulfilled': 'pending',
      'fulfilled': 'completed',
      'partially_fulfilled': 'in_progress',
      'cancelled': 'cancelled'
    };

    // Transform order data
    const transformedOrder = {
      order_date: new Date(shopifyOrder.created_at).toISOString().split('T')[0],
      status: statusMap[shopifyOrder.fulfillment_status] || 'pending',
      total_price: parseFloat(shopifyOrder.total_price) || 0,
      order_number: parseInt(shopifyOrder.order_number),
      customer_details: customerData,
      order_details: shopifyOrder.line_items.map(item => ({
        product_id: null,  // Will be set by service layer
        status: 'pending',
        quantity: item.quantity,
        title: item.title  // Temporary field to help find matching product
      }))
    };

    const currentUserId = req.user?.id;
    const newOrder = await orderService.createShopifyOrder(transformedOrder, currentUserId);

    res.status(201).json({
      success: true,
      data: newOrder,
      message: 'Shopify order created successfully'
    });
  } catch (err) {
    console.error('Error creating Shopify order:', err);
    if (err.code === '23505') {  // PostgreSQL unique violation error code
      res.status(409).json({
        success: false,
        error: 'Order number already exists'
      });
    } else {
      next(err);
    }
  }
}; 