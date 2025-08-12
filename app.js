require('dotenv').config();

console.log('ENV CHECK:', {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
});

const express = require('express');
const cors = require('cors');
const app = express()

//routes
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const customerRoutes = require('./routes/customerRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const fabricInvoiceRoutes = require('./routes/fabricInvoiceRoutes')

app.use(cors());
app.use(express.json());
app.use(express.json({ type: 'application/json' }));


// API endpoints
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);

// Webhook routes - mount at root level to match Shopify URL
app.use('/', webhookRoutes);

// Shipment endpoint
app.use('/api/shipment', shipmentRoutes);

// Fabric invoice endpoint
app.use('/api/fabric-invoice', fabricInvoiceRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'ZipCushions ERP API',
    version: '1.0.0',
    modules: ['Users', 'Orders', 'Customers', 'Make', 'Sales', 'Buy', 'Stock', 'Settings'],
    endpoints: {
      users: '/api/users',
      orders: '/api/orders',
      customers: '/api/customers',
      health: '/health',
      fabricInvoice: '/api/fabric-invoice'
    }
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false,
    error: 'Not found',
    path: req.path 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  
  // Handle Supabase errors
  if (err.code && err.message) {
    return res.status(400).json({ 
      success: false,
      error: err.message,
      code: err.code 
    });
  }
  
  res.status(500).json({ 
    success: false,
    error: 'Internal server error' 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Info: http://localhost:${PORT}/api`);
});
