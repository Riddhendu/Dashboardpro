
const express = require('express');
require('dotenv').config();
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const websocketFunctions = require('./src/Controllers/websocketFunctions');
const fileUpload = require('express-fileupload');
//const { pool, createTableQuery } = require('./src/Config/pgConfig'); // Import PostgreSQL configuration
const { SampleModel } = require('./src/Config/mongoConfig'); // Import MongoDB configuration
const connectDatabase = require("./src/Config/mongoConfig");
const UserMongo = require('./src/Models/UserMongo');
const Post = require('./src/Models/PostMongo');
const userRoutes = require('./src/Routes/userRoutes');
const postRoutes = require('./src/Routes/postRoutes');
const groupRoutes = require('./src/Routes/groupRoutes');
const retrieveAndShowData = require('./src/Controllers/RedisController')
const app = express();
const Httpserver = http.createServer(app);


// const io = socketIO(server);
app.use(cors());
app.use(fileUpload())
app.use(express.json())
app.use('/users', userRoutes);
app.use('/posts',postRoutes);
app.use('/groups',groupRoutes);


// Your PostgreSQL connection code...

// Your MongoDB (Mongoose) connection code...
connectDatabase()

// Express route example using PostgreSQL connection
// app.get('/postgres', (req, res) => {
//   pool.query('SELECT * users', (err, data) => {
//     if (err) {
//       res.status(500).json({ error: err.message });
//     } else {
//       res.json(data.rows);
//     }
//   });
// });


app.get('/fetchDataFromRedis', async (req, res) => {
  try {
    const data = await retrieveAndShowData(); // Using your controller function
    console.log('data=======>',data)
    // Respond with the fetched data
    res.status(200).json({ data });
  } catch (error) {
    // Handle errors
    res.status(500).json({ error: error.message });
  }
});

// Implement the following function to check user type
async function checkUserType(userId) {
  try {
    // Fetch user type from the database
    const user = await UserMongo.findById(userId);
    if (user) {
      return user.userType;
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error checking user type:', error.message);
    throw error;
  }
}

// Start the server
const PORT = process.env.PORT || 3000;
Httpserver.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const server = new socketIO.Server(Httpserver,{
  cors:{
    origin: '*'
  }
})

global.onlineUsers = new Map();
// server.on('connection', (socket) => {
//   console.log('Client connected');

//   // Check the user type before sending initial data
//   const userId = socket.handshake.query.userId; // Assuming you send userId during connection
//   checkUserType(userId)
//     .then((userType) => {
//       // if (userType === 'Admin') {
//         // On connection, send initial data and start monitoring
//         websocketFunctions.sendUserCountUpdates(socket, UserMongo);
//         websocketFunctions.sendPostUpdates(socket, Post);
//         websocketFunctions.simulateUserActivity(socket);
//       // } else {
//       //   console.log('Unauthorized access. Disconnecting...');
//       //   // socket.disconnect(true) //
//       // }
//     })
//     .catch((error) => {
//       console.error('Error checking user type:', error.message);
//       socket.disconnect(true);
//     });
// });
// server.on('connection', (socket) => {
//   console.log('A user connected');
  
//   // Emit initial data to the connected user (Admin)
//   websocketFunctions.emitAdminData(socket);
//   socket.on('disconnect', () => {
//     console.log('User disconnected');
//     socket.disconnect(true);
//   });
// });

server.on('connection', (socket) => {
  console.log('Client connected');

  // Check the user type before sending initial data
  const userId = socket.handshake.query.userId; // Assuming you send userId during connection
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
    server.emit("userCountUpdate", 
    { activeCount: onlineUsers.size, deactiveCount: 0 }
    );
    console.log('onlineUsers login',onlineUsers);
  });

  socket.on("logout-user", (userId) => {
    onlineUsers.delete(userId, socket.id);
    server.emit("userCountUpdate", 
    { activeCount: onlineUsers.size, deactiveCount: 1 }
    );
    console.log('onlineUsers logout',onlineUsers);
  });
  // Handle adding new comments
  socket.on('new-posts', (postId) => {
    // Broadcast the 'new-post' event to all connected clients
    onlineUsers.set(postId, socket.id);
    console.log('postId=========>',postId)
    server.emit('new-post', { activeCount: onlineUsers.size, });
    console.log('onlineUsers login',onlineUsers);
  });

  socket.on('add-user', (userId) => {
    onlineUsers.set(userId, socket.id);
    server.emit('userCountUpdate', { activeCount: onlineUsers.size, deactiveCount: 0 });
    console.log('onlineUsers login', onlineUsers);
  });

  socket.on('logout-user', (userId) => {
    onlineUsers.delete(userId, socket.id);
    server.emit('userCountUpdate', { activeCount: onlineUsers.size, deactiveCount: 1 });
    console.log('onlineUsers logout', onlineUsers);
  });

  // Handle adding new comments
  socket.on('add-comment', async ({ postId, comment }) => {
    try {
      const post = await Post.findById(postId);

      if (!post) {
        console.error('Post not found');
        return;
      }

      post.comments.push(comment);
      await post.save();

      // Emit the new comment to all connected clients
      server.emit('new-comment', { postId, comment });
    } catch (error) {
      console.error('Error adding comment:', error.message);
    }
  });
  // checkUserType(userId)
  //   .then((userType) => {
  //     console.log('userType',userType);
  //     if (userType === 'Admin') {
  //       //On connection, send initial data and start monitoring

        
  //       //websocketFunctions.sendUserCountUpdates(socket, UserMongo);
  //       // websocketFunctions.sendPostUpdates(socket, Post);
  //       // websocketFunctions.simulateUserActivity(socket);
  //     } else {
  //       console.log('Unauthorized access. Disconnecting...');
  //       // socket.disconnect(true) //
  //     }
  //   })
  //   .catch((error) => {
  //     console.error('Error checking user type:', error.message);
  //     socket.disconnect(true);
  //   });
});

module.exports = server