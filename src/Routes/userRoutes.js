

const express = require('express');
const router = express.Router();
const UserController = require('../Controllers/UserController');
const AuthController = require('../Controllers/AuthController')
const authenticateUser = require('../middleware/authMiddleware');

router.post('/register', UserController.registerUser);
router.post('/login', UserController.loginUser);
router.get('/getUser', UserController.getAllUsers);
router.post('/forgot-password', UserController.forgotPassword);
router.get('/admin-users', UserController.getAdminUsers);
router.post('/userone', UserController.getoneUser);
router.get('/get-all-files',authenticateUser, AuthController.getAllFilesFromS3);
router.get('/verify-email/:token', UserController.verifyEmail);
router.post('/reset-password/:token', UserController.resetPassword);
router.post('/upload-profile-pic', authenticateUser, AuthController.uploadProfilePic);
router.post('/update-password', authenticateUser, UserController.changePassword);
router.post('/logout', authenticateUser, UserController.logoutUser); 
router.post('/statusUpadte', authenticateUser, UserController.updateUserStatus); 
router.put('/update-profile', authenticateUser, UserController.updateProfile);
router.get('/user-data', authenticateUser, AuthController.getUserData);


module.exports = router;