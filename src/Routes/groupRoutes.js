const express = require('express');
const router = express.Router();
const GroupController = require('../Controllers/GroupController');
const authenticateUser = require('../middleware/authMiddleware');

// Create a new group
router.post('/creategroup', authenticateUser, GroupController.createGroup);

// Get all groups
router.get('/getgroups', authenticateUser, GroupController.getGroups);

module.exports = router;
