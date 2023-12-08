const mongoose = require('mongoose');

// MongoDB connection URI
const mongoURI = 'mongodb://localhost:27017/user';

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

