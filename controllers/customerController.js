const customerService = require('../services/customerService');

exports.getAllCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const customers = await customerService.getAllCustomers();
    
    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedCustomers = customers.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedCustomers,
      pagination: {
        current_page: parseInt(page),
        total_records: customers.length,
        total_pages: Math.ceil(customers.length / limit),
        per_page: parseInt(limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getCustomerById = async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Customer not found' 
      });
    }
    res.json({
      success: true,
      data: customer
    });
  } catch (err) {
    next(err);
  }
};

exports.createCustomer = async (req, res, next) => {
  try {
    const currentUserId = req.user?.id;
    const newCustomer = await customerService.createCustomer(req.body, currentUserId);
    res.status(201).json({
      success: true,
      data: newCustomer,
      message: 'Customer created successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const currentUserId = req.user?.id;
    const updatedCustomer = await customerService.updateCustomer(req.params.id, req.body, currentUserId);
    if (!updatedCustomer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Customer not found' 
      });
    }
    res.json({
      success: true,
      data: updatedCustomer,
      message: 'Customer updated successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const currentUserId = req.user?.id;
    const deleted = await customerService.deleteCustomer(req.params.id, currentUserId);
    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        error: 'Customer not found' 
      });
    }
    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (err) {
    next(err);
  }
}; 