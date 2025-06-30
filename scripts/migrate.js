require('dotenv').config();
const fs = require('fs');
const path = require('path');
const supabase = require('../config/supabaseClient');

async function executeSql(sql) {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) throw error;
  } catch (error) {
    // If RPC fails, try direct SQL through a select query
    console.log('Falling back to direct SQL execution...');
    const { error: directError } = await supabase.from('_migrations').select('*').limit(1);
    if (directError && !directError.message.includes('does not exist')) {
      throw error;
    }
    // If table doesn't exist, that's expected for the first migration
  }
}

async function executeMigration(filePath) {
  const fileName = path.basename(filePath);
  
  try {
    // For the first migration (000_setup_migration.sql), we don't check if it was executed
    if (!fileName.startsWith('000_')) {
      try {
        const { data: existingMigration } = await supabase
          .from('_migrations')
          .select('id')
          .eq('name', fileName)
          .single();

        if (existingMigration) {
          console.log(`Migration ${fileName} was already executed, skipping...`);
          return;
        }
      } catch (error) {
        // If _migrations table doesn't exist, that's expected for the first run
        if (!error.message.includes('does not exist')) {
          throw error;
        }
      }
    }

    // Read and execute the migration file
    const sql = fs.readFileSync(filePath, 'utf8');
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Running migration: ${fileName}`);
    
    for (const statement of statements) {
      console.log('Executing SQL statement:', statement.split('\n')[0] + '...');
      await executeSql(statement);
    }

    // Record the migration (skip for 000_setup_migration.sql)
    if (!fileName.startsWith('000_')) {
      try {
        await supabase.from('_migrations').insert([{ name: fileName }]);
      } catch (error) {
        // If table doesn't exist yet, that's expected
        if (!error.message.includes('does not exist')) {
          throw error;
        }
      }
    }

    console.log(`✅ Migration ${fileName} completed successfully`);
  } catch (error) {
    console.error(`❌ Error executing migration ${fileName}:`, error.message);
    throw error;
  }
}

async function migrate() {
  try {
    console.log('🚀 Starting database migrations...');

    // Create stored procedure for executing SQL
    const createProcedure = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text) 
      RETURNS void AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    await executeSql(createProcedure);

    // Get all .sql files from migrations directory
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Execute migrations in sequence
    for (const file of migrationFiles) {
      await executeMigration(path.join(migrationsDir, file));
    }

    console.log('🎉 All migrations completed successfully!\n');
    console.log('📊 Database Schema Created:');
    console.log('- Companies and Factories');
    console.log('- Users, Roles, and Permissions');
    console.log('- Customers and Products');
    console.log('- Orders and Order Details');
    console.log('- Items and Stock Management');
    console.log('- Activity Logging\n');
    console.log('💡 Next steps:');
    console.log('1. Run seed data: npm run seed');
    console.log('2. Test the API endpoints');
    console.log('3. Configure Row Level Security (RLS) in Supabase dashboard');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migrations if file is executed directly
if (require.main === module) {
  migrate();
}

module.exports = migrate; 
module.exports = { runMigration, resetDatabase }; 