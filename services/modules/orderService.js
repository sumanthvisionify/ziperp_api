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