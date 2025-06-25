const supabase = require('../config/supabaseClient');
const bcrypt = require('bcryptjs');

// Helper function to log activity
async function logActivity(userId, action, orderId = null, moduleName = 'Users') {
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

exports.getAllUsers = async (filterParams = {}) => {
  let query = supabase
    .from('users')
    .select(`
      *,
      role:roles(*),
      factory:factories(*, company:companies(*))
    `)
    .eq('is_deleted', false);
  
  // Apply filters
  if (filterParams.role_id) {
    query = query.eq('role_id', filterParams.role_id);
  }
  
  if (filterParams.factory_id) {
    query = query.eq('factory_id', filterParams.factory_id);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

exports.getUserById = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      role:roles(*),
      factory:factories(*, company:companies(*))
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error; // PGRST116: No rows found
  return data;
};

exports.getUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      role:roles(*),
      factory:factories(*, company:companies(*))
    `)
    .eq('email', email)
    .eq('is_deleted', false)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

exports.createUser = async (userData, createdBy = null) => {
  try {
    // Hash password if provided
    if (userData.password) {
      userData.password_hash = await bcrypt.hash(userData.password, 10);
      delete userData.password; // Remove plain text password
    }
    
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select(`
        *,
        role:roles(*),
        factory:factories(*, company:companies(*))
      `)
      .single();
      
    if (error) throw error;
    
    // Log activity
    if (createdBy) {
      await logActivity(createdBy, `Created user: ${data.name} (${data.email})`);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

exports.updateUser = async (id, userData, updatedBy = null) => {
  try {
    // Hash password if being updated
    if (userData.password) {
      userData.password_hash = await bcrypt.hash(userData.password, 10);
      delete userData.password;
    }
    
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .eq('is_deleted', false)
      .select(`
        *,
        role:roles(*),
        factory:factories(*, company:companies(*))
      `)
      .single();
      
    if (error) throw error;
    
    // Log activity
    if (updatedBy) {
      await logActivity(updatedBy, `Updated user: ${data.name} (${data.email})`);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

exports.deleteUser = async (id, deletedBy = null) => {
  try {
    // Get user info before soft delete
    const user = await exports.getUserById(id);
    if (!user) return false;
    
    const { error } = await supabase
      .from('users')
      .update({ is_deleted: true })
      .eq('id', id);
      
    if (error) throw error;
    
    // Log activity
    if (deletedBy) {
      await logActivity(deletedBy, `Deleted user: ${user.name} (${user.email})`);
    }
    
    return true;
  } catch (error) {
    throw error;
  }
};

exports.assignUserToRole = async (userId, roleId, assignedBy = null) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ role_id: roleId })
      .eq('id', userId)
      .eq('is_deleted', false)
      .select(`
        *,
        role:roles(*),
        factory:factories(*, company:companies(*))
      `)
      .single();
      
    if (error) throw error;
    
    // Log activity
    if (assignedBy) {
      await logActivity(assignedBy, `Assigned role to user: ${data.name} (${data.email})`);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

exports.assignUserToFactory = async (userId, factoryId, assignedBy = null) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ factory_id: factoryId })
      .eq('id', userId)
      .eq('is_deleted', false)
      .select(`
        *,
        role:roles(*),
        factory:factories(*, company:companies(*))
      `)
      .single();
      
    if (error) throw error;
    
    // Log activity
    if (assignedBy) {
      await logActivity(assignedBy, `Assigned factory to user: ${data.name} (${data.email})`);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

exports.getUserPermissions = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        role:roles(
          role_permissions(
            permission:permissions(*)
          )
        )
      `)
      .eq('id', userId)
      .eq('is_deleted', false)
      .single();
      
    if (error) throw error;
    
    // Extract permissions from the nested structure
    const permissions = data?.role?.role_permissions?.map(rp => rp.permission) || [];
    return permissions;
  } catch (error) {
    throw error;
  }
};

exports.verifyPassword = async (email, password) => {
  try {
    const user = await exports.getUserByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return null;
    
    return user;
  } catch (error) {
    throw error;
  }
}; 