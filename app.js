require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/modules/orderRoutes');
const customerRoutes = require('./routes/modules/customerRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);

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
      health: '/health'
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
