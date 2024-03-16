const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          // Check for non-empty and non-whitespace strings
          return /\S/.test(v);
        },
        message: 'Title cannot be empty or contain only spaces',
      },
    },
    description: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          // Check for non-empty and non-whitespace strings
          return /\S/.test(v);
        },
        message: 'Description cannot be empty or contain only spaces',
      },
    },
    permissionType: {
      type: String,
      enum: ['all', 'group'],
      default: 'all',
    },
    allowedGroups: {
      type: [String],
      default: [],
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'UserMongo', 
        },
        text: {
          type: String,
          required: true,
          validate: {
            validator: function(v) {
              // Check for non-empty and non-whitespace strings
              return /\S/.test(v);
            },
            message: 'Comments cannot be empty or contain only spaces',
          },
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
