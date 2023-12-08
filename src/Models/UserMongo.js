const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
      email: {
        type: String,
        required: true,
        unique: true,
      },
      name: {
        type: String,
        required: true,
      },
      password: {
        type: String,
        required: true,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
      userType: {
        type: String,
        enum: ['Admin', 'Normal'],
        required: true,
      },
      serialBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserMongo', // Refers to the same collection
      },
      token: {
        type: String,
        default: null, // Default value if not provided during user creation
      },
      profilePic: {
        type: String, // Assuming profilePic will store the file path
      },
    },
    
    {
      timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
  );
  
const UserMongo = mongoose.model('UserMongo', userSchema);

module.exports = UserMongo;