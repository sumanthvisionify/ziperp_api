const { createClient } = require('@supabase/supabase-js');

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

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

// Test connection
supabase.from('orders').select('count').single()
  .then(() => console.log('✅ Connected to Supabase with service role'))
  .catch(err => {
    console.error('❌ Connection error:', err.message);
    if (err.message.includes('permission denied')) {
      console.error('Service role key not working. Please check your SUPABASE_SERVICE_KEY');
      console.error('Make sure you are using the service_role key, not the anon key!');
      console.error('The service role key should start with "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."');
    }
  });

module.exports = supabase;
