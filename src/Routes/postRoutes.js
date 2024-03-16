const express = require('express');
const router = express.Router();
const PostController = require('../Controllers/PostController');
const authenticateUser = require('../middleware/authMiddleware');

// Create a new post
router.post('/createposts', authenticateUser, PostController.createPost);

// Get posts based on permission type and user groups
router.get('/getposts', authenticateUser, PostController.getPosts);

// Add a comment to a specific post
router.post('/posts/:postId/comment', authenticateUser, PostController.addComment);



module.exports = router;