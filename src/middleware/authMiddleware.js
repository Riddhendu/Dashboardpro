const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
function authenticateUser(req, res, next) {
  // Get the token from the request headers, query parameters, or body
  const token = req.headers.authorization || req.query.token || req.body.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Token not provided' });
  }

  // Verify the token
  jwt.verify(token, 'your_secret_key', (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    
    // If the token is valid, set the user ID in the request for further processing
    req.userId = decoded.userId;
    next(); // Call next middleware or proceed to the route handler
  });
}

module.exports = authenticateUser;
