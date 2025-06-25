require('dotenv').config();
const supabase = require('../config/supabaseClient');

async function getExistingData() {
  console.log('📊 Fetching existing data...');
  
  const [customersResult, productsResult, itemsResult, factoriesResult, companiesResult] = await Promise.all([
    supabase.from('customers').select('*').eq('is_deleted', false),
    supabase.from('products').select('*').eq('is_deleted', false),
    supabase.from('items').select('*').eq('is_deleted', false),
    supabase.from('factories').select('*').eq('is_deleted', false),
    supabase.from('companies').select('*').eq('is_deleted', false)
  ]);
  
  if (customersResult.error) throw customersResult.error;
  if (productsResult.error) throw productsResult.error;
  if (itemsResult.error) throw itemsResult.error;
  if (factoriesResult.error) throw factoriesResult.error;
  if (companiesResult.error) throw companiesResult.error;
  
  return {
    customers: customersResult.data,
    products: productsResult.data,
    items: itemsResult.data,
    factories: factoriesResult.data,
    companies: companiesResult.data
  };
}

async function createDummyOrders(numOrders = 10) {
  try {
    console.log('🚀 Starting dummy order creation...');
    
    const { customers, products, items, factories, companies } = await getExistingData();
    
    if (!customers.length || !products.length || !items.length || !factories.length || !companies.length) {
      throw new Error('Missing required data. Please run the seed script first.');
    }
    
    const company = companies[0]; // Use the first company
    const orderStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'shipped'];
    const orderDetailStatuses = ['pending', 'confirmed', 'in_progress', 'completed'];
    
    console.log(`🌱 Creating ${numOrders} dummy orders...`);
    
    // Create orders
    const ordersToCreate = [];
    for (let i = 0; i < numOrders; i++) {
      const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
      const randomFactory = factories[Math.floor(Math.random() * factories.length)];
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 180)); // Orders from last 180 days
      
      ordersToCreate.push({
        customer_id: randomCustomer.id,
        order_date: orderDate.toISOString().split('T')[0],
        status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        company_id: company.id,
        factory_id: randomFactory.id
      });
    }
    
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .insert(ordersToCreate)
      .select();
    
    if (orderError) throw orderError;
    
    console.log(`✅ Created ${orders.length} orders successfully`);
    
    // Create order details
    const orderDetailsToCreate = [];
    
    for (const order of orders) {
      // Each order has 1-4 products
      const numProducts = Math.floor(Math.random() * 4) + 1;
      const selectedProducts = [];
      
      for (let i = 0; i < numProducts; i++) {
        let product;
        do {
          product = products[Math.floor(Math.random() * products.length)];
        } while (selectedProducts.some(p => p.id === product.id));
        selectedProducts.push(product);
        
        const orderDetail = {
          order_id: order.id,
          product_id: product.id,
          status: orderDetailStatuses[Math.floor(Math.random() * orderDetailStatuses.length)],
          factory_id: order.factory_id,
          company_id: order.company_id
        };
        
        orderDetailsToCreate.push(orderDetail);
      }
    }
    
    const { data: orderDetails, error: orderDetailError } = await supabase
      .from('order_details')
      .insert(orderDetailsToCreate)
      .select();
    
    if (orderDetailError) throw orderDetailError;
    
    console.log(`✅ Created ${orderDetails.length} order details successfully`);
    
    // Create order detail ingredients
    const orderDetailIngredientsToCreate = [];
    
    for (const orderDetail of orderDetails) {
      const order = orders.find(o => o.id === orderDetail.order_id);
      
      // Each order detail has 2-5 ingredients
      const numIngredients = Math.floor(Math.random() * 4) + 2;
      const selectedItems = [];
      
      for (let i = 0; i < numIngredients; i++) {
        let item;
        do {
          item = items[Math.floor(Math.random() * items.length)];
        } while (selectedItems.some(it => it.id === item.id));
        selectedItems.push(item);
        
        const ingredient = {
          order_details_id: orderDetail.id,
          order_id: order.id,
          item_id: item.id,
          quantity: (Math.random() * 15 + 0.5).toFixed(2), // Random quantity between 0.5-15.5
          status: orderDetailStatuses[Math.floor(Math.random() * orderDetailStatuses.length)],
          factory_id: order.factory_id,
          company_id: order.company_id
        };
        
        orderDetailIngredientsToCreate.push(ingredient);
      }
    }
    
    const { data: orderDetailIngredients, error: ingredientError } = await supabase
      .from('order_detail_ingredients')
      .insert(orderDetailIngredientsToCreate)
      .select();
    
    if (ingredientError) throw ingredientError;
    
    console.log(`✅ Created ${orderDetailIngredients.length} order detail ingredients successfully`);
    
    console.log('\n🎉 Dummy order creation completed successfully!');
    console.log('\n📊 Created:');
    console.log(`- ${orders.length} orders`);
    console.log(`- ${orderDetails.length} order details`);
    console.log(`- ${orderDetailIngredients.length} order detail ingredients`);
    
    // Show sample order data
    const sampleOrder = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(name, email),
        company:companies(name),
        factory:factories(location),
        order_details(
          *,
          product:products(name, description),
          order_detail_ingredients(
            *,
            item:items(name)
          )
        )
      `)
      .eq('id', orders[0].id)
      .single();
    
    console.log('\n📋 Sample Order Created:');
    console.log(JSON.stringify(sampleOrder.data, null, 2));
    
    return { orders, orderDetails, orderDetailIngredients };
    
  } catch (error) {
    console.error('💥 Order creation failed:', error.message);
    throw error;
  }
}

// Script execution
if (require.main === module) {
  const numOrders = process.argv[2] ? parseInt(process.argv[2]) : 10;
  
  if (isNaN(numOrders) || numOrders < 1) {
    console.error('❌ Please provide a valid number of orders to create');
    console.log('Usage: node createOrders.js [number_of_orders]');
    console.log('Example: node createOrders.js 25');
    process.exit(1);
  }
  
  createDummyOrders(numOrders)
    .then(() => {
      console.log('✨ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { createDummyOrders, getExistingData }; 