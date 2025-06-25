const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

console.log('Environment check:');
console.log('SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('SUPABASE_SERVICE_KEY:', supabaseKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('Environment variables loaded:');
  console.error('SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_SERVICE_KEY:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'undefined');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
