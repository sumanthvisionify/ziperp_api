const supabase = require('../config/supabaseClient');

// Helper function to log activity
async function logActivity(userId, action, customerId = null, moduleName = 'Customers') {
  try {
    // Get user information
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', userId)
      .single();
      
    if (userError) throw userError;

    await supabase.from('activity_log').insert([{
      module_name: moduleName,
      record_id: customerId,
      change_log: action,
      performed_by: {
        user_id: user.id,
        user_name: user.name,
        email: user.email
      }
    }]);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

exports.getAllCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};

exports.getCustomerById = async (id) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

exports.createCustomer = async (customerData, createdBy = null) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();
      
    if (error) throw error;
    
    // Log activity
    if (createdBy) {
      await logActivity(createdBy, `Created customer with name : ${data.name}, email : (${data.email}) with id ${data.id}`, data.id);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

exports.updateCustomer = async (id, customerData, updatedBy = null) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .update(customerData)
      .eq('id', id)
      .eq('is_deleted', false)
      .select()
      .single();
      
    if (error) throw error;
    
    // Log activity
    if (updatedBy) {
      await logActivity(updatedBy, 'Updated customer', id);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

exports.deleteCustomer = async (id, deletedBy = null) => {
  try {
    // Check if customer exists
    const customer = await exports.getCustomerById(id);
    if (!customer) return false;
    
    // Soft delete
    const { error } = await supabase
      .from('customers')
      .update({ is_deleted: true })
      .eq('id', id);
      
    if (error) throw error;
    
    // Log activity
    if (deletedBy) {
      await logActivity(deletedBy, 'Deleted customer', id);
    }
    
    return true;
  } catch (error) {
    throw error;
  }
}; 