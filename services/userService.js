const supabase = require('../config/supabaseClient');
const bcrypt = require('bcryptjs');

exports.getUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from('users')
    .select('*, role:roles(*), factory:factories(*)')
    .eq('email', email)
    .eq('is_deleted', false)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  return data;
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
