const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');
const UserMongo = require('../Models/UserMongo');

const { pool } = require('../Config/pgConfig'); 
const upload = fileUpload();


AWS.config.update({
  accessKeyId: process.env.AWSID,
  secretAccessKey: process.env.AWSKEY,
  region: process.env.AWSREGION
});
const s3 = new AWS.S3();

async function uploadToS3(filePath, fileName) {
  const fileContent = fs.readFileSync(filePath);

  const params = {
    Bucket: process.env.AWSBUCKET,
    Key: fileName,
    Body: fileContent
  };

  return s3.upload(params).promise();
}

const allowedExtensions = ['.jpg', '.jpeg', '.png'];

async function uploadProfilePic(req, res) {
  try {
    const userId = req.user._id;
    const user = await UserMongo.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    if (!req.files || !req.files.profilePics) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    let profilePics = req.files.profilePics;

    if (!Array.isArray(profilePics)) {
      profilePics = [profilePics];
    }

    if (profilePics.length > 3) {
      return res.status(400).json({ error: 'Maximum of 3 files allowed' });
    }

    let uploadedPics = [];

    for (const file of profilePics) {
      if (uploadedPics.length >= 3) {
        break; // Limit reached, exit the loop
      }

      const ext = path.extname(file.name).toLowerCase();

      if (!allowedExtensions.includes(ext)) {
        return res.status(400).json({ error: `File type ${ext} not allowed` });
      }

      const newFileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`;
      const filePath = path.join(__dirname, `../uploads/${newFileName}`);
      
      await file.mv(filePath);
      uploadedPics.push(filePath);

      await uploadToS3(filePath, newFileName);
    }

    user.profilePics = uploadedPics;
    await user.save();

    res.status(200).json({ message: 'Profile pictures uploaded successfully', files: uploadedPics });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}


  
  // Function to get user data
const getUserData = async (req, res) => {
  try {
    
    const userData = req.user;
    console.log('userdata================>',userData)
    // Check if user data exists
    if (!userData) {
      return res.status(404).json({ error: 'User data not found' });
    }

    // Send the user data in the response
    return res.status(200).json({ userData });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

async function getAllFilesFromS3(req, res) {
  try {
    const bucketName = process.env.AWSBUCKET;

    const params = {
      Bucket: bucketName
    };

    const data = await s3.listObjectsV2(params).promise();
    const fileKeys = data.Contents.map((obj) => obj.Key);

    res.status(200).json({ files: fileKeys });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { uploadProfilePic,getUserData ,getAllFilesFromS3};
