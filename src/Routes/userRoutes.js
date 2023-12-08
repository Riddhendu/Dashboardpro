// routes.js

const express = require('express');
const router = express.Router();
const UserController = require('../Controllers/UserController');
const AuthController = require('../Controllers/AuthController')
const authenticateUser = require('../middleware/authMiddleware');
// Registration route
router.post('/register', UserController.registerUser);
router.post('/login', UserController.loginUser);
router.post('/upload-profile-pic', authenticateUser, AuthController.uploadProfilePic);
module.exports = router;