require('dotenv').config();
const express = require('express');
const app = require('../app');

// Test script to verify order creation functionality
console.log('🧪 Testing Order Creation API...');

// Import the order service directly to test
const orderService = require('../services/modules/orderService');

async function testOrderCreation() {
  try {
    console.log('📊 Testing dummy order creation service...');
    
    const result = await orderService.createDummyOrders(3);
    
    console.log('✅ Service test successful!');
    console.log(`Created ${result.orders.length} orders, ${result.orderDetails.length} order details, ${result.orderDetailIngredients.length} ingredients`);
    
    // Test getting orders
    console.log('\n📋 Testing order retrieval...');
    const allOrders = await orderService.getAllOrders();
    console.log(`✅ Found ${allOrders.length} total orders in database`);
    
    // Show a sample order
    if (allOrders.length > 0) {
      const sampleOrder = await orderService.getOrderById(allOrders[0].id);
      console.log('\n📋 Sample Order Structure:');
      console.log(JSON.stringify(sampleOrder, null, 2));
    }
    
    console.log('\n🎉 All tests passed! Order system is working correctly.');
    console.log('\n📊 Summary of available orders:');
    
    const ordersByStatus = {};
    allOrders.forEach(order => {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    });
    
    Object.entries(ordersByStatus).forEach(([status, count]) => {
      console.log(`- ${status}: ${count} orders`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run the test
testOrderCreation()
  .then(() => {
    console.log('\n✨ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  }); 