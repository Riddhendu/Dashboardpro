const mongoose = require('mongoose');


const groupSchema = new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
        unique: true,
        validate: {
          validator: function(v) {
            // Check for non-empty and non-whitespace strings
            return /\S/.test(v);
          },
          message: 'GroupTitle cannot be empty or contain only spaces',
        },
      },
      member: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'UserMongo', // Refers to the same collection
        default: null, // Default value when not specified
      },
    },
    
    {
      timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
  );
  
const GroupMongo = mongoose.model('GroupMongo', groupSchema);

module.exports = GroupMongo;