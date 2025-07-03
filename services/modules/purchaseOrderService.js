const supabase = require('../../config/supabaseClient');

// Helper function to log activity
async function logActivity(userId, action, purchaseOrderId = null, moduleName = 'Purchase Orders') {
  try {
    await supabase.from('activity_log').insert([{
      user_id: userId,
      purchase_order_id: purchaseOrderId,
      action,
      module_name: moduleName
    }]);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

exports.getAllPurchaseOrders = async () => {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      supplier:suppliers(*)
    `)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};

exports.getPurchaseOrderById = async (id) => {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      supplier:suppliers(*)
    `)
    .eq('id', id)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

exports.createPurchaseOrder = async (orderData, createdBy = null) => {
  try {
    // Validate supplier exists
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('id', orderData.supplier_id)
      .eq('is_deleted', false)
      .single();
      
    if (supplierError || !supplier) {
      throw new Error('Invalid supplier_id or supplier not found');
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .insert([orderData])
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .single();
      
    if (error) throw error;
    
    // Log activity
    if (createdBy) {
      await logActivity(createdBy, 'Created purchase order', data.id);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

exports.updatePurchaseOrder = async (id, orderData, updatedBy = null) => {
  try {
    // If supplier_id is being updated, validate it exists
    if (orderData.supplier_id) {
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('id')
        .eq('id', orderData.supplier_id)
        .eq('is_deleted', false)
        .single();
        
      if (supplierError || !supplier) {
        throw new Error('Invalid supplier_id or supplier not found');
      }
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .update(orderData)
      .eq('id', id)
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .single();
      
    if (error) throw error;
    
    // Log activity
    if (updatedBy) {
      await logActivity(updatedBy, 'Updated purchase order', id);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

exports.deletePurchaseOrder = async (id, deletedBy = null) => {
  try {
    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    // Log activity
    if (deletedBy) {
      await logActivity(deletedBy, 'Deleted purchase order', id);
    }
    
    return true;
  } catch (error) {
    throw error;
  }
}; 