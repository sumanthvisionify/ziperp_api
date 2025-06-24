const supabase = require('../config/supabaseClient');

exports.getAllUsers = async () => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data;
};

exports.getUserById = async (id) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116: No rows found
  return data;
};

exports.createUser = async (user) => {
  const { data, error } = await supabase.from('users').insert([user]).single();
  if (error) throw error;
  return data;
};

exports.updateUser = async (id, user) => {
  const { data, error } = await supabase.from('users').update(user).eq('id', id).single();
  if (error) throw error;
  return data;
};

exports.deleteUser = async (id) => {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
  return true;
}; 