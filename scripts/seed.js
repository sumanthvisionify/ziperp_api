require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabaseClient');

async function seedRoles() {
  console.log('🌱 Seeding roles...');
  
  const roles = [
    { role_name: 'super_admin' },
    { role_name: 'admin' },
    { role_name: 'manager' },
    { role_name: 'operator' },
    { role_name: 'viewer' }
  ];
  
  const { data, error } = await supabase
    .from('roles')
    .insert(roles)
    .select();
  
  if (error) {
    console.error('Error seeding roles:', error);
    throw error;
  }
  
  console.log('✅ Roles seeded successfully');
  return data;
}

async function seedPermissions() {
  console.log('🌱 Seeding permissions...');
  
  const permissions = [
    // Make Module
    { module_name: 'Make', can_read: true, can_write: true, can_delete: true, can_manage_users: false },
    { module_name: 'Make', can_read: true, can_write: true, can_delete: false, can_manage_users: false },
    { module_name: 'Make', can_read: true, can_write: false, can_delete: false, can_manage_users: false },
    
    // Sales Module
    { module_name: 'Sales', can_read: true, can_write: true, can_delete: true, can_manage_users: false },
    { module_name: 'Sales', can_read: true, can_write: true, can_delete: false, can_manage_users: false },
    { module_name: 'Sales', can_read: true, can_write: false, can_delete: false, can_manage_users: false },
    
    // Buy Module
    { module_name: 'Buy', can_read: true, can_write: true, can_delete: true, can_manage_users: false },
    { module_name: 'Buy', can_read: true, can_write: true, can_delete: false, can_manage_users: false },
    { module_name: 'Buy', can_read: true, can_write: false, can_delete: false, can_manage_users: false },
    
    // Stock Module
    { module_name: 'Stock', can_read: true, can_write: true, can_delete: true, can_manage_users: false },
    { module_name: 'Stock', can_read: true, can_write: true, can_delete: false, can_manage_users: false },
    { module_name: 'Stock', can_read: true, can_write: false, can_delete: false, can_manage_users: false },
    
    // Settings Module
    { module_name: 'Settings', can_read: true, can_write: true, can_delete: true, can_manage_users: true },
    { module_name: 'Settings', can_read: true, can_write: true, can_delete: false, can_manage_users: false },
    { module_name: 'Settings', can_read: true, can_write: false, can_delete: false, can_manage_users: false }
  ];
  
  const { data, error } = await supabase
    .from('permissions')
    .insert(permissions)
    .select();
  
  if (error) {
    console.error('Error seeding permissions:', error);
    throw error;
  }
  
  console.log('✅ Permissions seeded successfully');
  return data;
}

async function seedRolePermissions(roles, permissions) {
  console.log('🌱 Seeding role permissions...');
  
  // Map role permissions
  const superAdminRole = roles.find(r => r.role_name === 'super_admin');
  const adminRole = roles.find(r => r.role_name === 'admin');
  const managerRole = roles.find(r => r.role_name === 'manager');
  const operatorRole = roles.find(r => r.role_name === 'operator');
  const viewerRole = roles.find(r => r.role_name === 'viewer');
  
  // Super Admin gets all permissions (full access to all modules)
  const superAdminPermissions = permissions
    .filter(p => p.can_read && p.can_write && p.can_delete)
    .map(p => ({ role_id: superAdminRole.id, permission_id: p.id }));
  
  // Admin gets full access except user management
  const adminPermissions = permissions
    .filter(p => p.can_read && p.can_write && p.can_delete && !p.can_manage_users)
    .map(p => ({ role_id: adminRole.id, permission_id: p.id }));
  
  // Manager gets read/write access
  const managerPermissions = permissions
    .filter(p => p.can_read && p.can_write && !p.can_delete)
    .map(p => ({ role_id: managerRole.id, permission_id: p.id }));
  
  // Operator gets read/write to Make and Stock only
  const operatorPermissions = permissions
    .filter(p => p.can_read && p.can_write && !p.can_delete && (p.module_name === 'Make' || p.module_name === 'Stock'))
    .map(p => ({ role_id: operatorRole.id, permission_id: p.id }));
  
  // Viewer gets read-only access
  const viewerPermissions = permissions
    .filter(p => p.can_read && !p.can_write && !p.can_delete)
    .map(p => ({ role_id: viewerRole.id, permission_id: p.id }));
  
  const allRolePermissions = [
    ...superAdminPermissions,
    ...adminPermissions,
    ...managerPermissions,
    ...operatorPermissions,
    ...viewerPermissions
  ];
  
  const { error } = await supabase
    .from('role_permissions')
    .insert(allRolePermissions);
  
  if (error) {
    console.error('Error seeding role permissions:', error);
    throw error;
  }
  
  console.log('✅ Role permissions seeded successfully');
}

async function seedCompaniesAndFactories() {
  console.log('🌱 Seeding companies and factories...');
  
  // Create sample company
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert([{
      name: 'ZipCushions Manufacturing',
      phone: '+1-555-0123',
      address: '123 Industrial Blvd, Manufacturing City, MC 12345'
    }])
    .select()
    .single();
  
  if (companyError) {
    console.error('Error seeding company:', companyError);
    throw companyError;
  }
  
  // Create sample factories
  const factories = [
    {
      company_id: company.id,
      location: 'Main Factory',
      address: '123 Industrial Blvd, Manufacturing City, MC 12345',
      phone: '+1-555-0124'
    },
    {
      company_id: company.id,
      location: 'Secondary Factory',
      address: '456 Production Ave, Manufacturing City, MC 12346',
      phone: '+1-555-0125'
    }
  ];
  
  const { data: factoryData, error: factoryError } = await supabase
    .from('factories')
    .insert(factories)
    .select();
  
  if (factoryError) {
    console.error('Error seeding factories:', factoryError);
    throw factoryError;
  }
  
  // Update company with primary factory
  await supabase
    .from('companies')
    .update({ factory_id: factoryData[0].id })
    .eq('id', company.id);
  
  console.log('✅ Companies and factories seeded successfully');
  return { company, factories: factoryData };
}

async function seedUsers(roles, factories) {
  console.log('🌱 Seeding users...');
  
  const superAdminRole = roles.find(r => r.role_name === 'super_admin');
  const adminRole = roles.find(r => r.role_name === 'admin');
  const managerRole = roles.find(r => r.role_name === 'manager');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const users = [
    {
      name: 'Super Admin',
      email: 'superadmin@zipcushions.com',
      password_hash: hashedPassword,
      role_id: superAdminRole.id,
      factory_id: factories[0].id
    },
    {
      name: 'Admin User',
      email: 'admin@zipcushions.com',
      password_hash: hashedPassword,
      role_id: adminRole.id,
      factory_id: factories[0].id
    },
    {
      name: 'Factory Manager',
      email: 'manager@zipcushions.com',
      password_hash: hashedPassword,
      role_id: managerRole.id,
      factory_id: factories[1].id
    }
  ];
  
  const { data, error } = await supabase
    .from('users')
    .insert(users)
    .select();
  
  if (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
  
  console.log('✅ Users seeded successfully');
  return data;
}

async function seedCustomers() {
  console.log('🌱 Seeding customers...');
  
  const customers = [
    {
      name: 'ABC Furniture Co.',
      address: '789 Retail Street, Furniture City, FC 54321',
      phone: '+1-555-0201',
      email: 'orders@abcfurniture.com',
      status: 'active'
    },
    {
      name: 'XYZ Home Decor',
      address: '321 Design Avenue, Decor Town, DT 98765',
      phone: '+1-555-0202',
      email: 'purchasing@xyzhomedecor.com',
      status: 'active'
    },
    {
      name: 'Premium Seating Solutions',
      address: '654 Comfort Lane, Seating City, SC 13579',
      phone: '+1-555-0203',
      email: 'orders@premiumseating.com',
      status: 'active'
    }
  ];
  
  const { data, error } = await supabase
    .from('customers')
    .insert(customers)
    .select();
  
  if (error) {
    console.error('Error seeding customers:', error);
    throw error;
  }
  
  console.log('✅ Customers seeded successfully');
  return data;
}

async function seedProducts() {
  console.log('🌱 Seeding products...');
  
  const products = [
    {
      name: 'Standard Chair Cushion',
      description: 'High-quality chair cushion with premium foam filling',
      base_unit: 'piece'
    },
    {
      name: 'Luxury Sofa Cushion',
      description: 'Premium sofa cushion with memory foam and organic cotton cover',
      base_unit: 'piece'
    },
    {
      name: 'Outdoor Bench Cushion',
      description: 'Weather-resistant bench cushion for outdoor furniture',
      base_unit: 'piece'
    },
    {
      name: 'Custom Shaped Cushion',
      description: 'Custom-made cushions for special furniture shapes',
      base_unit: 'piece'
    }
  ];
  
  const { data, error } = await supabase
    .from('products')
    .insert(products)
    .select();
  
  if (error) {
    console.error('Error seeding products:', error);
    throw error;
  }
  
  console.log('✅ Products seeded successfully');
  return data;
}

async function seedItems(factories) {
  console.log('🌱 Seeding items...');
  
  const items = [
    {
      name: 'Premium Foam',
      availability: true,
      factory_id: factories[0].id,
      company_id: factories[0].company_id
    },
    {
      name: 'Memory Foam',
      availability: true,
      factory_id: factories[0].id,
      company_id: factories[0].company_id
    },
    {
      name: 'Organic Cotton Fabric',
      availability: true,
      factory_id: factories[1].id,
      company_id: factories[1].company_id
    },
    {
      name: 'Polyester Fabric',
      availability: true,
      factory_id: factories[1].id,
      company_id: factories[1].company_id
    },
    {
      name: 'Waterproof Fabric',
      availability: true,
      factory_id: factories[0].id,
      company_id: factories[0].company_id
    },
    {
      name: 'Zipper (Heavy Duty)',
      availability: true,
      factory_id: factories[0].id,
      company_id: factories[0].company_id
    },
    {
      name: 'Thread (Industrial)',
      availability: true,
      factory_id: factories[1].id,
      company_id: factories[1].company_id
    }
  ];
  
  const { data, error } = await supabase
    .from('items')
    .insert(items)
    .select();
  
  if (error) {
    console.error('Error seeding items:', error);
    throw error;
  }
  
  console.log('✅ Items seeded successfully');
  return data;
}

async function seedStock(items) {
  console.log('🌱 Seeding stock...');
  
  const stockEntries = items.map(item => ({
    item_id: item.id,
    factory_id: item.factory_id,
    item_type: 'item',
    available_quantity: Math.floor(Math.random() * 1000) + 100 // Random quantity between 100-1100
  }));
  
  const { data, error } = await supabase
    .from('stock')
    .insert(stockEntries)
    .select();
  
  if (error) {
    console.error('Error seeding stock:', error);
    throw error;
  }
  
  console.log('✅ Stock seeded successfully');
  return data;
}

async function main() {
  try {
    console.log('🚀 Starting database seeding...');
    
    // Seed in order due to foreign key dependencies
    const roles = await seedRoles();
    const permissions = await seedPermissions();
    await seedRolePermissions(roles, permissions);
    
    const { company, factories } = await seedCompaniesAndFactories();
    const users = await seedUsers(roles, factories);
    const customers = await seedCustomers();
    const products = await seedProducts();
    const items = await seedItems(factories);
    const stock = await seedStock(items);
    
    console.log('🎉 Database seeding completed successfully!');
    
    console.log('\n📊 Seeded Data Summary:');
    console.log(`- ${roles.length} roles`);
    console.log(`- ${permissions.length} permissions`);
    console.log(`- 1 company with ${factories.length} factories`);
    console.log(`- ${users.length} users`);
    console.log(`- ${customers.length} customers`);
    console.log(`- ${products.length} products`);
    console.log(`- ${items.length} items`);
    console.log(`- ${stock.length} stock entries`);
    
    console.log('\n🔐 Test User Credentials:');
    console.log('Super Admin: superadmin@zipcushions.com / password123');
    console.log('Admin: admin@zipcushions.com / password123');
    console.log('Manager: manager@zipcushions.com / password123');
    
  } catch (error) {
    console.error('💥 Seeding failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { 
  seedRoles, 
  seedPermissions, 
  seedRolePermissions, 
  seedCompaniesAndFactories,
  seedUsers,
  seedCustomers,
  seedProducts,
  seedItems,
  seedStock
}; 