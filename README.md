# ZipCushions ERP API

A comprehensive Enterprise Resource Planning (ERP) system backend built with Express.js and Supabase, designed for manufacturing companies with multiple modules including Make, Sales, Buy, Stock, and Settings.

## 🏗️ Architecture

This ERP system is built with:
- **Backend**: Express.js with RESTful APIs
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth with Row Level Security (RLS)
- **Authorization**: Role-based access control with module-specific permissions

## 📊 Database Schema

The system includes the following main entities based on the ER diagram:

### Core Tables
- **Companies & Factories**: Multi-factory support with hierarchical organization
- **Users & Roles**: Role-based access control with factory assignments
- **Permissions**: Module-specific permissions (Make, Sales, Buy, Stock, Settings)
- **Customers**: Customer management for sales
- **Products**: Finished products catalog
- **Items**: Raw materials and components
- **Stock**: Inventory management with factory-specific tracking
- **Orders**: Sales orders with nested order details and ingredients
- **Activity Log**: Comprehensive audit trail

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd visionify

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your Supabase credentials:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3000
NODE_ENV=development
```

### 3. Database Setup

```bash
# Run migrations to create database schema
npm run migrate

# Seed initial data (roles, permissions, sample data)
npm run seed

# Or setup everything at once
npm run db:setup
```

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:3000`

## 📋 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Health Check
```http
GET /health
```

### Authentication

#### Login
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "admin@zipcushions.com",
  "password": "password123"
}
```

### Users Management

#### Get All Users
```http
GET /api/users?role_id=uuid&factory_id=uuid
```

#### Get User by ID
```http
GET /api/users/:id
```

#### Create User
```http
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role_id": "uuid",
  "factory_id": "uuid"
}
```

#### Update User
```http
PUT /api/users/:id
Content-Type: application/json

{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

#### Assign Role
```http
PUT /api/users/:id/assign-role
Content-Type: application/json

{
  "roleId": "uuid"
}
```

#### Assign Factory
```http
PUT /api/users/:id/assign-factory
Content-Type: application/json

{
  "factoryId": "uuid"
}
```

#### Get User Permissions
```http
GET /api/users/:id/permissions
```

### Orders Management

#### Get All Orders
```http
GET /api/orders?customer_id=uuid&status=pending&factory_id=uuid&start_date=2024-01-01&end_date=2024-12-31&page=1&limit=20
```

#### Get Order by ID
```http
GET /api/orders/:id
```

#### Create Order
```http
POST /api/orders
Content-Type: application/json

{
  "customer_id": "uuid",
  "order_date": "2024-01-15",
  "factory_id": "uuid",
  "company_id": "uuid",
  "order_details": [
    {
      "product_id": "uuid",
      "factory_id": "uuid",
      "company_id": "uuid",
      "order_detail_ingredients": [
        {
          "item_id": "uuid",
          "quantity": 10.5,
          "factory_id": "uuid",
          "company_id": "uuid"
        }
      ]
    }
  ]
}
```

#### Update Order Status
```http
PUT /api/orders/:id/status
Content-Type: application/json

{
  "status": "confirmed"
}
```

#### Bulk Update Order Status
```http
PUT /api/orders/bulk/status
Content-Type: application/json

{
  "order_ids": ["uuid1", "uuid2", "uuid3"],
  "status": "shipped"
}
```

#### Get Orders by Customer
```http
GET /api/orders/customer/:customerId
```

#### Get Orders by Status
```http
GET /api/orders/status/:status
```

#### Get Orders by Factory
```http
GET /api/orders/factory/:factoryId
```

#### Get Orders Requiring Items
```http
GET /api/orders/production/items-required?factory_id=uuid
```

#### Get Order Analytics
```http
GET /api/orders/analytics/summary?start_date=2024-01-01&end_date=2024-12-31&factory_id=uuid
```

## 👥 User Roles & Permissions

### Roles Hierarchy
1. **Super Admin**: Full system access, can manage companies and factories
2. **Admin**: Full module access within assigned company
3. **Manager**: Read/write access to all modules within assigned factory
4. **Operator**: Read/write access to Make and Stock modules only
5. **Viewer**: Read-only access to all modules

### Module Permissions
- **Make**: Production and manufacturing operations
- **Sales**: Order management and customer relations
- **Buy**: Procurement and supplier management
- **Stock**: Inventory and warehouse management
- **Settings**: System configuration and user management

## 🔒 Security Features

### Row Level Security (RLS)
The system implements comprehensive RLS policies:
- Users can only access data from their assigned factory/company
- Role-based data filtering
- Module-specific permission checks
- Audit trail protection

### Authentication
- Secure password hashing with bcrypt
- Session-based authentication
- Role and factory-based authorization

## 🛠️ Development

### Project Structure
```
visionify/
├── app.js                     # Main application file
├── config/
│   └── supabaseClient.js     # Supabase configuration
├── controllers/
│   ├── userController.js     # User management
│   └── modules/
│       └── orderController.js # Order management
├── services/
│   ├── userService.js        # User business logic
│   └── modules/
│       └── orderService.js   # Order business logic
├── routes/
│   ├── userRoutes.js         # User API routes
│   └── modules/
│       └── orderRoutes.js    # Order API routes
├── migrations/
│   ├── 001_initial_schema.sql    # Database schema
│   └── 002_row_level_security.sql # RLS policies
└── scripts/
    ├── migrate.js            # Migration runner
    └── seed.js               # Data seeder
```

### Available Scripts
- `npm run dev` - Start development server with auto-reload
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run migrate:reset` - Reset and re-run migrations
- `npm run seed` - Populate database with initial data
- `npm run db:setup` - Run migrations and seed data

### Adding New Modules
1. Create service in `services/modules/`
2. Create controller in `controllers/modules/`
3. Create routes in `routes/modules/`
4. Add routes to `app.js`
5. Update RLS policies if needed

## 📝 Sample Data

The seed script creates:
- 5 user roles (super_admin, admin, manager, operator, viewer)
- 15 permissions across 5 modules
- 1 company with 2 factories
- 3 test users with different roles
- 3 sample customers
- 4 products
- 7 items (raw materials)
- Stock entries for all items

### Test Credentials
- **Super Admin**: `superadmin@zipcushions.com` / `password123`
- **Admin**: `admin@zipcushions.com` / `password123`
- **Manager**: `manager@zipcushions.com` / `password123`

## 🔧 Troubleshooting

### Migration Issues
If automatic migration fails, manually run the SQL files in Supabase SQL editor:
1. Go to Supabase Dashboard → SQL Editor
2. Copy content from `migrations/001_initial_schema.sql`
3. Execute the SQL
4. Repeat for `migrations/002_row_level_security.sql`

### Common Issues
- **Database connection**: Verify SUPABASE_URL and SUPABASE_SERVICE_KEY
- **Permission errors**: Check RLS policies are correctly applied
- **Missing tables**: Run migrations first before seeding

## 🚀 Deployment

### Vercel/Netlify
1. Set environment variables in platform dashboard
2. Connect repository
3. Deploy

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

For support and questions, please open an issue in the GitHub repository. 