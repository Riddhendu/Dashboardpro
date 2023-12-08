const multer = require('multer');
const path = require('path');
const UserMongo = require('../Models/UserMongo');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Save uploaded files to the 'uploads' directory
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); // Rename uploaded files with a unique timestamp
  },
});

// Multer upload configuration
const upload = multer({ storage: storage });

async function uploadProfilePic(req, res) {
  try {
    const userId = req.userId; // Assuming you have userId from authenticated user

    const user = await UserMongo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Multer middleware used to handle the file upload
    upload.single('profilePic')(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: 'File upload error' });
      } else if (err) {
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Save the file path or details to the user profile in the database
      user.profilePic = req.file.path; // Assuming 'profilePic' is a field in the UserMongo schema
      await user.save();

      res.status(200).json({ message: 'Profile picture uploaded successfully', file: req.file });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

module.exports = { uploadProfilePic };
