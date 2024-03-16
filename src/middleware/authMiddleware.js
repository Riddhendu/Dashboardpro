const jwt = require('jsonwebtoken');
const UserMongo = require('../Models/UserMongo');

const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization || req.query.token || req.body.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Token not provided' });
  }

  try {
    const decodedData = jwt.verify(token, process.env.SECRET_KEY);
    console.log('decodedData',decodedData)
    req.user = await UserMongo.findById(decodedData.userId); // Assuming 'userId' is the user identifier in the database
    req.pgUserId = decodedData.pgUserId
    // console.log('req.user',req.user)
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = authenticateUser;
