const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserMongo = require('../Models/UserMongo');
const nodemailer = require('nodemailer');
async function registerUser(req, res) {
    const { email, name, password, phoneNumber, userType, serialBy } = req.body;
  
    try {
      // Check if serialBy is specified and exists
      if (serialBy) {
        const parentUser = await UserMongo.findById(serialBy);
        if (!parentUser) {
          throw new Error('Parent user not found');
        }
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10); // Hashing password with salt rounds
  
      // Create a new user with the hashed password
      const newUser = await UserMongo.create({
        email,
        name,
        password: hashedPassword, // Store hashed password in the database
        phoneNumber,
        userType,
        serialBy,
      });
  
      // Generate JWT token
      const token = jwt.sign({ userId: newUser._id }, 'wewqeqweqweqwq'); // Replace 'your_secret_key' with your actual secret key
  
      // Store token in the database
      newUser.token = token; // Assuming there's a 'token' field in your UserMongo schema
      await newUser.save();
  
      // Send email notification upon successful registration
      const transporter = nodemailer.createTransport({
        // Specify your email service configuration (SMTP, SMTP pool, etc.)
        service: 'gmail',
        auth: {
          user: 'riddhendu@gmail.com', // Your email address
          pass: 'kxzuqvjruaajjthf', // Your email password or app-specific password
        },
      });
  
      const mailOptions = {
        from: 'riddhendu@gmail.com', // Sender email address
        to: email, // Receiver email address (user's email)
        subject: 'Registration Successful',
        text: `Hello ${name},\n\nYour registration was successful! Thank you for joining us.`,
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          // Continue the registration process even if email fails
        } else {
          console.log('Email sent:', info.response);
        }
      });
  
      // Send the response with the token excluded
      res.status(201).json({ message: `${newUser.name} registered successfully`, userId: newUser._id, userName: newUser.name });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async function loginUser(req, res) {
    const { email, password } = req.body;
  
    try {
      // Check if user exists
      const user = await UserMongo.findOne({ email });
      if (!user) {
        throw new Error('Invalid email or password');
      }
  
      // Compare passwords
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        throw new Error('Invalid email or password');
      }
  
      // Check if token exists
      if (!user.token) {
        throw new Error('Token not found');
      }
  
      // Verify token
      jwt.verify(user.token, 'wewqeqweqweqwq', (err, decoded) => {
        if (err) {
          throw new Error('Invalid token');
        }
  
        // Token verified successfully
        res.status(200).json({ message: 'Login successful', token: user.token });
      });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }
  
  
  module.exports = { registerUser, loginUser };
  

