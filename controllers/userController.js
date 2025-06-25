const userService = require('../services/userService');

exports.getAllUsers = async (req, res, next) => {
  try {
    const { role_id, factory_id } = req.query;
    const filterParams = {};
    
    if (role_id) filterParams.role_id = role_id;
    if (factory_id) filterParams.factory_id = factory_id;
    
    const users = await userService.getAllUsers(filterParams);
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const currentUserId = req.user?.id; // Assuming auth middleware sets req.user
    const newUser = await userService.createUser(req.body, currentUserId);
    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const currentUserId = req.user?.id;
    const updatedUser = await userService.updateUser(req.params.id, req.body, currentUserId);
    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const currentUserId = req.user?.id;
    const deleted = await userService.deleteUser(req.params.id, currentUserId);
    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.assignRole = async (req, res, next) => {
  try {
    const { roleId } = req.body;
    const currentUserId = req.user?.id;
    
    if (!roleId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Role ID is required' 
      });
    }
    
    const updatedUser = await userService.assignUserToRole(req.params.id, roleId, currentUserId);
    res.json({
      success: true,
      data: updatedUser,
      message: 'Role assigned successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.assignFactory = async (req, res, next) => {
  try {
    const { factoryId } = req.body;
    const currentUserId = req.user?.id;
    
    if (!factoryId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Factory ID is required' 
      });
    }
    
    const updatedUser = await userService.assignUserToFactory(req.params.id, factoryId, currentUserId);
    res.json({
      success: true,
      data: updatedUser,
      message: 'Factory assigned successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserPermissions = async (req, res, next) => {
  try {
    const permissions = await userService.getUserPermissions(req.params.id);
    res.json({
      success: true,
      data: permissions
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }
    
    const user = await userService.verifyPassword(email, password);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }
    
    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      data: userWithoutPassword,
      message: 'Login successful'
    });
  } catch (err) {
    next(err);
  }
}; 