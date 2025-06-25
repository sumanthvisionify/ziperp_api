const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/modules/orderController');

// Main order CRUD routes
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', orderController.createOrder);
router.put('/:id', orderController.updateOrder);
router.delete('/:id', orderController.deleteOrder);

// Order status management
router.put('/:id/status', orderController.updateOrderStatus);

// Dummy data creation
router.post('/dummy/create', orderController.createDummyOrders);

// Order filtering and grouping routes
router.get('/customer/:customerId', orderController.getOrdersByCustomer);
router.get('/status/:status', orderController.getOrdersByStatus);
router.get('/factory/:factoryId', orderController.getOrdersByFactory);

// Production and inventory routes
router.get('/production/items-required', orderController.getOrdersRequiringItems);

// Analytics routes
router.get('/analytics/summary', orderController.getOrderAnalytics);

// Bulk operations
router.put('/bulk/status', orderController.bulkUpdateOrderStatus);

module.exports = router; 