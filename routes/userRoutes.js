const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Authentication routes
router.post('/login', userController.login);

// User CRUD routes
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// User assignment routes
router.put('/:id/assign-role', userController.assignRole);
router.put('/:id/assign-factory', userController.assignFactory);

// User permissions
router.get('/:id/permissions', userController.getUserPermissions);

module.exports = router; 