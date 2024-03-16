const mongoose = require('mongoose');

// const passwordValidator = function (password) {
//   // Define regex for strong password (min 6 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special character)
//   const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

//   // Check if the password matches the strong password regex
//   return strongPasswordRegex.test(password);
// };

const userSchema = new mongoose.Schema(
    {
      email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
      },
      name: {
        type: String,
        required: true,
      },
      password: {
        type: String,
        required: true,
        
      },
      confirmPassword: {
        type: String,
        required: true,
        validate: {
          validator: function (v) {
            // Access the document using `this` and compare the passwords
            return v === this.password;
          },
          message: 'Passwords do not match',
        },
      },
      phoneNumber: {
        type: String,
        required: true,
        unique: true,
        validate: {
          validator: function(v) {
            return /^\d{10}$/.test(v); 
          },
          message: props => `${props.value} is not a valid phone number! Please enter a 10-digit number.`,
        },
      },
      userType: {
        type: String,
        enum: ['Admin', 'Normal'],
        required: true,
      },
      serialBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserMongo', // Refers to the same collection
        default: null, // Default value when not specified
      },
      token: {
        type: String,
        default: null, // Default value if not provided during user creation
      },
      profilePics: {
        type: [String], // Array of strings to store multiple file paths
        default: [], // Default empty array
      },
      invalidatedTokens: {
        type: [String], // Array of invalidated tokens
        default: [], // Default empty array
      },
      isVerified:{
        type:Boolean,
        default: false,
      },
      emailVerificationToken: {
        type: String,
        default: null,
      },
      emailVerificationExpires: {
        type: Date,
        default: null,
      },
    },
    
    {
      timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
  );
  
const UserMongo = mongoose.model('UserMongo', userSchema);

module.exports = UserMongo;