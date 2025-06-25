const supabase = require('../../config/supabaseClient');

// Helper function to log activity
async function logActivity(userId, action, orderId = null, moduleName = 'Orders') {
  try {
    await supabase.from('activity_log').insert([{
      user_id: userId,
      order_id: orderId,
      action,
      module_name: moduleName
    }]);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

exports.getAllOrders = async (filterParams = {}) => {
  let query = supabase
    .from('orders')
    .select(`
      *,
      customer:customers(*),
      company:companies(*),
      factory:factories(*),
      order_details(
        *,
        product:products(*),
        order_detail_ingredients(
          *,
          item:items(*)
        )
      )
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
  
  // Apply filters
  if (filterParams.customer_id) {
    query = query.eq('customer_id', filterParams.customer_id);
  }
  
  if (filterParams.status) {
    query = query.eq('status', filterParams.status);
  }
  
  if (filterParams.factory_id) {
    query = query.eq('factory_id', filterParams.factory_id);
  }
  
  if (filterParams.start_date && filterParams.end_date) {
    query = query.gte('order_date', filterParams.start_date)
                  .lte('order_date', filterParams.end_date);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

exports.getOrderById = async (id) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers(*),
      company:companies(*),
      factory:factories(*),
      order_details(
        *,
        product:products(*),
        order_detail_ingredients(
          *,
          item:items(*)
        )
      )
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

exports.createOrder = async (orderData, createdBy = null) => {
  try {
    const { order_details, ...orderMain } = orderData;
    
    // Create the main order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderMain])
      .select()
      .single();
      
    if (orderError) throw orderError;
    
    // Create order details if provided
    if (order_details && order_details.length > 0) {
      const orderDetailsWithOrderId = order_details.map(detail => ({
        ...detail,
        order_id: order.id
      }));
      
      const { data: createdDetails, error: detailsError } = await supabase
        .from('order_details')
        .insert(orderDetailsWithOrderId)
        .select();
        
      if (detailsError) throw detailsError;
      
      // Create order detail ingredients if provided
      for (const detail of order_details) {
        if (detail.order_detail_ingredients && detail.order_detail_ingredients.length > 0) {
          const correspondingDetail = createdDetails.find(cd => 
            cd.product_id === detail.product_id
          );
          
          const ingredientsWithIds = detail.order_detail_ingredients.map(ingredient => ({
            ...ingredient,
            order_id: order.id,
            order_details_id: correspondingDetail.id
          }));
          
          const { error: ingredientsError } = await supabase
            .from('order_detail_ingredients')
            .insert(ingredientsWithIds);
            
          if (ingredientsError) throw ingredientsError;
        }
      }
    }
    
    // Log activity
    if (createdBy) {
      await logActivity(createdBy, `Created order for customer`, order.id);
    }
    
    // Return the complete order with all relations
    return await exports.getOrderById(order.id);
    
  } catch (error) {
    throw error;
  }
};

exports.updateOrder = async (id, orderData, updatedBy = null) => {
  try {
    const { order_details, ...orderMain } = orderData;
    
    // Update the main order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update(orderMain)
      .eq('id', id)
      .eq('is_deleted', false)
      .select()
      .single();
      
    if (orderError) throw orderError;
    
    // Handle order details updates if provided
    if (order_details) {
      // For simplicity, we'll delete existing details and recreate them
      // In production, you might want a more sophisticated update strategy
      
      // Delete existing order detail ingredients
      await supabase
        .from('order_detail_ingredients')
        .delete()
        .eq('order_id', id);
      
      // Delete existing order details
      await supabase
        .from('order_details')
        .delete()
        .eq('order_id', id);
      
      // Recreate order details and ingredients
      if (order_details.length > 0) {
        const orderDetailsWithOrderId = order_details.map(detail => ({
          ...detail,
          order_id: id
        }));
        
        const { data: createdDetails, error: detailsError } = await supabase
          .from('order_details')
          .insert(orderDetailsWithOrderId)
          .select();
          
        if (detailsError) throw detailsError;
        
        // Recreate order detail ingredients
        for (const detail of order_details) {
          if (detail.order_detail_ingredients && detail.order_detail_ingredients.length > 0) {
            const correspondingDetail = createdDetails.find(cd => 
              cd.product_id === detail.product_id
            );
            
            const ingredientsWithIds = detail.order_detail_ingredients.map(ingredient => ({
              ...ingredient,
              order_id: id,
              order_details_id: correspondingDetail.id
            }));
            
            const { error: ingredientsError } = await supabase
              .from('order_detail_ingredients')
              .insert(ingredientsWithIds);
              
            if (ingredientsError) throw ingredientsError;
          }
        }
      }
    }
    
    // Log activity
    if (updatedBy) {
      await logActivity(updatedBy, `Updated order`, id);
    }
    
    // Return the complete updated order
    return await exports.getOrderById(id);
    
  } catch (error) {
    throw error;
  }
};

exports.updateOrderStatus = async (id, status, updatedBy = null) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .eq('is_deleted', false)
      .select()
      .single();
      
    if (error) throw error;
    
    // Log activity
    if (updatedBy) {
      await logActivity(updatedBy, `Updated order status to: ${status}`, id);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

exports.deleteOrder = async (id, deletedBy = null) => {
  try {
    // Get order info before soft delete
    const order = await exports.getOrderById(id);
    if (!order) return false;
    
    // Soft delete order detail ingredients
    await supabase
      .from('order_detail_ingredients')
      .update({ is_deleted: true })
      .eq('order_id', id);
    
    // Soft delete order details
    await supabase
      .from('order_details')
      .update({ is_deleted: true })
      .eq('order_id', id);
    
    // Soft delete main order
    const { error } = await supabase
      .from('orders')
      .update({ is_deleted: true })
      .eq('id', id);
      
    if (error) throw error;
    
    // Log activity
    if (deletedBy) {
      await logActivity(deletedBy, `Deleted order`, id);
    }
    
    return true;
  } catch (error) {
    throw error;
  }
};

exports.getOrdersByCustomer = async (customerId) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers(*),
      order_details(
        *,
        product:products(*)
      )
    `)
    .eq('customer_id', customerId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};

exports.getOrdersByStatus = async (status) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers(*),
      order_details(
        *,
        product:products(*)
      )
    `)
    .eq('status', status)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};

exports.getOrdersByFactory = async (factoryId) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers(*),
      factory:factories(*),
      order_details(
        *,
        product:products(*)
      )
    `)
    .eq('factory_id', factoryId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};

exports.getOrdersRequiringItems = async (factoryId = null) => {
  let query = supabase
    .from('order_detail_ingredients')
    .select(`
      *,
      order:orders(*),
      order_detail:order_details(*, product:products(*)),
      item:items(*)
    `)
    .eq('is_deleted', false)
    .in('status', ['pending', 'in_progress']);
  
  if (factoryId) {
    query = query.eq('factory_id', factoryId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Analytics functions
exports.getOrderAnalytics = async (startDate, endDate, factoryId = null) => {
  try {
    let query = supabase
      .from('orders')
      .select('*')
      .eq('is_deleted', false)
      .gte('order_date', startDate)
      .lte('order_date', endDate);
    
    if (factoryId) {
      query = query.eq('factory_id', factoryId);
    }
    
    const { data: orders, error } = await query;
    if (error) throw error;
    
    // Calculate analytics
    const analytics = {
      total_orders: orders.length,
      orders_by_status: {},
      orders_by_date: {}
    };
    
    orders.forEach(order => {
      // Group by status
      if (!analytics.orders_by_status[order.status]) {
        analytics.orders_by_status[order.status] = 0;
      }
      analytics.orders_by_status[order.status]++;
      
      // Group by date
      const dateKey = order.order_date;
      if (!analytics.orders_by_date[dateKey]) {
        analytics.orders_by_date[dateKey] = 0;
      }
      analytics.orders_by_date[dateKey]++;
    });
    
    return analytics;
  } catch (error) {
    throw error;
  }
};

// Dummy data creation function
exports.createDummyOrders = async (numOrders = 5, createdBy = null) => {
  try {
    // Get existing data needed for dummy orders
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
    
    const customers = customersResult.data;
    const products = productsResult.data;
    const items = itemsResult.data;
    const factories = factoriesResult.data;
    const companies = companiesResult.data;
    
    if (!customers.length || !products.length || !items.length || !factories.length || !companies.length) {
      throw new Error('Insufficient data available. Please ensure customers, products, items, factories, and companies exist.');
    }
    
    const company = companies[0];
    const orderStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'shipped'];
    const orderDetailStatuses = ['pending', 'confirmed', 'in_progress', 'completed'];
    
    // Create dummy orders
    const ordersToCreate = [];
    for (let i = 0; i < numOrders; i++) {
      const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
      const randomFactory = factories[Math.floor(Math.random() * factories.length)];
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 60)); // Orders from last 60 days
      
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
    
    // Create order details
    const orderDetailsToCreate = [];
    
    for (const order of orders) {
      // Each order has 1-3 products
      const numProducts = Math.floor(Math.random() * 3) + 1;
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
    
    // Create order detail ingredients
    const orderDetailIngredientsToCreate = [];
    
    for (const orderDetail of orderDetails) {
      const order = orders.find(o => o.id === orderDetail.order_id);
      
      // Each order detail has 2-4 ingredients
      const numIngredients = Math.floor(Math.random() * 3) + 2;
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
          quantity: (Math.random() * 10 + 1).toFixed(2), // Random quantity between 1-11
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
    
    // Log activity
    if (createdBy) {
      await logActivity(createdBy, `Created ${orders.length} dummy orders via API`);
    }
    
    return { orders, orderDetails, orderDetailIngredients };
    
  } catch (error) {
    throw error;
  }
}; 