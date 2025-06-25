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