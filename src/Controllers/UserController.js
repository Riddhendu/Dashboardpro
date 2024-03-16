const express = require('express');
const http = require('http');
const bcrypt = require('bcrypt');
const socketIO = require('socket.io');
const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { pool } = require('../Config/pgConfig');
const UserMongo = require('../Models/UserMongo');
const nodemailer = require('nodemailer');
const { user } = require('pg/lib/defaults');
const app = express();
const Httpserver = http.createServer(app);
const server = require('../../index')
const websocketFunctions = require('../Controllers/websocketFunctions')
const readHTMLFile = (pathToFile) => {
  return new Promise((resolve, reject) => {
    fs.readFile(pathToFile, { encoding: 'utf-8' }, (err, html) => {
      if (err) {
        reject(err);
      } else {
        resolve(html);
      }
    });
  });
};

async function registerUser(req, res) {
  const { email, name, password, confirmPassword, phoneNumber, userType, serialBy } = req.body;
  console.log('bodyyyyyyyyyyyyy========>',req.body)

  try {


    let parentUser;
    let adminUser = false;


    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (serialBy) {
      // Check if serialBy is specified and exists
      parentUser = await UserMongo.findById(serialBy);
      if (!parentUser) {
        throw new Error('Parent user not found');
      }
    } else {
      // If no serialBy is specified, consider the user an Admin
      adminUser = true;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Insert user data into PostgreSQL
    const newUserPGSQL = await pool.query(
      'INSERT INTO users (name, email, password, phoneNumber, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, hashedPassword, phoneNumber, new Date()]
    );
    console.log('const newUserPGSQL =======>', newUserPGSQL)
    // Create a new user with the hashed password
    const newUser = await UserMongo.create({
      email,
      name,
      password: hashedPassword,
      confirmPassword: hashedPassword,
      phoneNumber,
      userType: adminUser ? 'Admin' : userType,
      serialBy: adminUser ? null : serialBy, // Set serialBy only if not an Admin
    });
    const pgId = newUserPGSQL.rows[0].id
    console.log('pgId==========>', pgId)
    // Generate JWT token
    const token = jwt.sign({ userId: newUser._id, userEmail: email, pgUserId: pgId }, process.env.SECRET_KEY);

    // Store token in the database
    newUser.token = token;
    await newUser.save();

    const emailTemplatePath = path.join(__dirname, 'templates', 'registration_email_template.html');
    console.log('emailTemplatePath========>', emailTemplatePath)
    const emailTemplate = await readHTMLFile(emailTemplatePath);
    console.log('emailTemplatePath========>', emailTemplate)
    const formattedEmailTemplate = emailTemplate
      .replace('{{name}}', name)
      .replace('{{verificationLink}}', `${process.env.BASE_URL}/verify-email/${token}`);
    sgMail.setApiKey(process.env.SENDGRID_API);
    const msg = {
      to: email,
      from: process.env.MAIL, // Replace with your verified sender
      subject: 'Registration Successful',
      html: formattedEmailTemplate,
    };

    try {
      await sgMail.send(msg);
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error.toString());
    }

    // Determine the message based on whether it's an Admin or Normal user
    const message = adminUser
      ? `${newUser.name} registered as Admin successfully`
      : `${newUser.name} registered successfully`;

    res.status(201).json({ message, userId: newUser._id, userName: newUser.name });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}


async function updateProfile(req, res) {
  const userId = req.user._id; // Assuming req.user contains the logged-in user details
  console.log('verificationToken==============>', userId)

  try {
    const { email, name, password, phoneNumber, profilePics } = req.body; // Assuming these fields can be updated

    // Fetch the user by their ID
    const user = await UserMongo.findById(userId);
    console.log('userIdupdate4321432423==============>', user)

    if (!user) {
      return res.status(404).json({ error: 'User not found' });

    }

    // Check if the user is of userType 'Normal'
    if (user.userType !== 'Normal') {
      return res.status(403).json({ error: 'Forbidden: Only Normal users can update their profile' });
    }
    if (email && email !== user.email && !user.isVerified) {
      return res.status(403).json({ error: 'Forbidden: Email update requires verification' });
    }
    // Update all the fields provided in the request body
    if (email && email !== user.email && user.isVerified) {
      // Generate a verification token for email confirmation

      console.log('email==============>', email)
      console.log('useremail==============>', user.email)
      const verificationToken = jwt.sign({ userId: user._id, userEmail: email }, process.env.SECRET_KEY);
      console.log('verificationToken==============>', verificationToken)
      console.log('hiiiiiiiiiiiiiiiiii----------------------------------')

      const emailTemplatePath = path.join(__dirname, 'templates', 'verification_email_template.html');
      const emailTemplate = await readHTMLFile(emailTemplatePath);
      const formattedEmailTemplate = emailTemplate
        .replace('{{name}}', name)
        .replace('{{verificationLink}}', `${process.env.BASE_URL}/verify-email/${verificationToken}`);

      sgMail.setApiKey(process.env.SENDGRID_API);
      const msg = {
        to: email,
        from: process.env.MAIL,
        subject: 'Email Verification',
        html: formattedEmailTemplate,
      };

      try {
        await sgMail.send(msg);
        console.log('Email sent successfully');
        user.emailVerificationToken = verificationToken;
        // user.emailVerificationExpires = Date.now() + 3600000; // Token valid for 1 hour
        user.isVerified = false;
        user.email = email;
        await user.save();
        
        return res.status(200).json({ message: 'Email verification sent successfully' });
      } catch (error) {
        console.error('Error sending email:', error.toString());
        return res.status(500).json({ error: 'Error sending verification email' });
      }



    }
    else {
      console.log('hello----------------------------------')
      if (name) {
        user.name = name;
      }
      if (email) {
        user.email = email;
      }
      if (password) {
        user.password = password;
      }
      if (phoneNumber) {
        user.phoneNumber = phoneNumber;
      }
      if (profilePics) {
        user.profilePics = profilePics;
      }

      let updatedEmail = user.email
      let updatedName = user.name
      let updatedPassword = user.password
      let updatedPhone = user.phoneNumber

      let pgId = req.pgUserId
      pool.query(
        'UPDATE users SET email = $1, name = $2, password = $3, phoneNumber = $4 WHERE id = $5',
        [updatedEmail, updatedName, updatedPassword, updatedPhone, pgId],
        (err, result) => {
          if (err) {
            console.error('Error executing query', err);
          } else {
            console.log('Update successful');
          }
        }
      );
      await user.save();

      // Respond with success message
      res.status(200).json({ message: 'Profile updated successfully' });
    }
  }

  catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    // Find the user by email in MongoDB
    const user = await UserMongo.findOne({ email });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate a token for resetting the password
    // const resetToken = jwt.sign({ userId: user._id, userEmail: email }, process.env.SECRET_KEY);
    const resetToken = jwt.sign(
      { userId: user._id, userEmail: email },
      process.env.SECRET_KEY,
      { expiresIn: '1h' } // Set expiration time (e.g., 1 hour)
    );

    // Send an email to the user with the reset password link
    const emailTemplatePath = path.join(__dirname, 'templates', 'reset_password_email_template.html');
    const emailTemplate = await readHTMLFile(emailTemplatePath);
    const formattedEmailTemplate = emailTemplate
      .replace('{{name}}', user.name)
      .replace('{{resetLink}}', `${process.env.BASE_URL}/verify-email/${resetToken}`);

    sgMail.setApiKey(process.env.SENDGRID_API);
    const msg = {
      to: email,
      from: process.env.MAIL,
      subject: 'Reset Password',
      html: formattedEmailTemplate,
    };

    await sgMail.send(msg);
    console.log('Reset password email sent successfully');
    user.isVerified = false;
    await user.save()
    res.status(200).json({ message: 'Reset password email sent successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function verifyEmail(req, res) {
  const { token } = req.params;

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
      console.log('decoded=========>',decoded)
    // Find the user in the database using the decoded userId
    const user = await UserMongo.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If the user is found, mark them as verified (Activate their account)
    user.isVerified = true;
    user.email = decoded.userEmail;
    await user.save();
    const successHTMLFilePath = path.join(__dirname, 'templates', 'email_verified_success.html');
    res.sendFile(successHTMLFilePath);
    // return res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    // Handle token verification errors
    return res.status(400).json({ error: 'Invalid or expired token' });
  }
}

// Password validator function
const passwordValidator = function (password) {
  // Define regex for strong password (min 6 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special character)
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

  // Check if the password matches the strong password regex
  return strongPasswordRegex.test(password);
};
async function changePassword(req, res) {
  try {
    const userId = req.user._id; // Assuming you have the user ID in the authenticated request
    console.log('userrrrrrrrrr======>', userId)
    const { oldPassword, newPassword } = req.body;

    // Fetch the user by ID
    const user = await UserMongo.findById(userId);
    console.log('userrrrrrrrrr======>', user)
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the provided old password matches the user's current hashed password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    console.log('isMatch======>', isMatch)
    if (!isMatch) {
      return res.status(400).json({ error: 'Old password is incorrect' });
    }

    // Validate the new password
    const passwordIsValid = passwordValidator(newPassword);
    console.log('passwordIsValid======>', passwordIsValid)
    if (!passwordIsValid) {
      return res.status(400).json({
        error: 'Password should be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      });
    }

    // Hash the new password before saving it
    const hashedPassword = await bcrypt.hash(newPassword, 10); // You can adjust the salt rounds

    // Set the new hashed password and save the user
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function resetPassword(req, res) {
  const { token } = req.params;
  const { newPassword ,confirmPassword } = req.body;

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Find the user in the database using the decoded userId
    const user = await UserMongo.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash the new password before saving it
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Set the new hashed password and save the user
    user.password = hashedPassword;
    user.confirmPassword= hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.log('errrrrrrrrrrrrr===========>',error)
    // Handle token verification errors or other errors
    return res.status(400).json({ error: 'Password reset failed' });
  }
}

async function getAllUsers(req, res) {
  try {
    const users = await UserMongo.find({});
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}








async function loginUser(req, res) {
  const { email, password } = req.body;

  try {
    // Check if user exists in MongoDB
    const userMongo = await UserMongo.findOne({ email });

    // Validate user from MongoDB
    if (!userMongo) {
      throw new Error('Invalid email or password');
    }

    if (!userMongo.isVerified) {
      throw new Error('Please verify your email first');
    }

    // Compare passwords for MongoDB user
    const passwordMatchMongo = await bcrypt.compare(password, userMongo.password);
    if (!passwordMatchMongo) {
      throw new Error('Invalid email or password');
    }

    // Check if token exists in MongoDB user
    if (!userMongo.token) {
      throw new Error('Token not found');
    }

    // Check if the token is invalidated for this user
    if (userMongo.invalidatedTokens.includes(userMongo.token)) {
      const index = userMongo.invalidatedTokens.indexOf(userMongo.token);
      if (index > -1) {
        userMongo.invalidatedTokens.splice(index, 1);
      }

      await UserMongo.findByIdAndUpdate(userMongo._id, { $set: { invalidatedTokens: userMongo.invalidatedTokens } },
        { new: true }); // To return the updated document//
    
    }

    // Verify token from MongoDB user
    jwt.verify(userMongo.token, process.env.SECRET_KEY, async (err, decoded) => {
      if (err) {
        throw new Error('Invalid token');
      }

      // Set is_online to '1'
      // if(userMongo.userType === 'Normal'){
      //   await UserMongo.findByIdAndUpdate(userMongo._id, { $set: { is_online: '1' } }, { new: true });
      // }
         // Emit event when a user logs in
  
      res.status(200).json({
        message: 'Login successful',
        token: userMongo.token,
        userId: userMongo._id,
        userType: userMongo.userType
      });
       
      // Emit user login event
      // server.emit('userActivity', { eventType: 'login', userId: userMongo._id, userType: userMongo.userType });
      // websocketFunctions.emitUserLogin(server);
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}




async function logoutUser(req, res) {
  try {
    const userId = req.user.id; // Assuming user ID is available in req.user

    // Logout user from MongoDB
    // await UserMongo.findByIdAndUpdate(userId, { $set: { token: null } });

    await UserMongo.findByIdAndUpdate(userId, { $push: { invalidatedTokens: req.headers.authorization } });
    // Logout user from PostgreSQL
    // await UserPg.update({ token: null }, { where: { id: userId } });
    // server.emit('userLogout', {eventType: 'logout', userId });
    await UserMongo.findByIdAndUpdate(userId, { $set: { is_online: '0' } }, { new: true });
    
    res.status(200).json({ message: 'Logout successful' });
    // websocketFunctions.emitUserLogout(server);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}


async function updateUserStatus(req, res) {
  try {
    const userId = req.user.id; // Assuming user ID is available in req.user

    // Logout user from MongoDB
    // await UserMongo.findByIdAndUpdate(userId, { $set: { token: null } });

    
    // Logout user from PostgreSQL
    // await UserPg.update({ token: null }, { where: { id: userId } });
    // server.emit('userLogout', {eventType: 'logout', userId });
    await UserMongo.findByIdAndUpdate(userId, { $set: { is_online: '0' } }, { new: true });
    res.status(200).json({ message: 'Status update successful' });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getAdminUsers(req, res) {
  try {
    // Find all users with userType 'Admin'
    const adminUsers = await UserMongo.find({ userType: 'Admin' });

    res.status(200).json(adminUsers);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getoneUser(req, res) {
  try {
    
    const Users = await UserMongo.findOne({ email: req.body.email });

    res.status(200).json(Users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}





module.exports = {getoneUser,updateUserStatus ,registerUser, loginUser, logoutUser, verifyEmail, getAllUsers, changePassword, updateProfile, getAdminUsers,resetPassword, forgotPassword };


