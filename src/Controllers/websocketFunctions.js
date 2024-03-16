const UserMongo = require('../Models/UserMongo')
const Post = require('../Models/PostMongo')


const emitUserLogin = async (socket) => {
  // Emit event to all connected clients
  socket.emit('userLogin');
  // Also emit updated admin data after user login
  await emitAdminData(socket);
};

const emitUserLogout = async (socket) => {
  // Emit event to all connected clients
  socket.emit('userLogout');
  // Also emit updated admin data after user logout
  await emitAdminData(socket);
};

const emitAdminData = async (socket) => {
  // Fetch and emit real-time data to the Admin
  const activeUsersCount = await UserMongo.countDocuments({ is_online: '1' , userType: 'Normal' });
  const deactiveUsersCount = await UserMongo.countDocuments({ is_online: '0', userType: 'Normal' });

  const postTitlesWithComments = await getPostTitlesWithComments();
   console.log('activeUsersCount======>',activeUsersCount)
   console.log('deactiveUsersCount======>',deactiveUsersCount)
   console.log('postTitlesWithComments======>',postTitlesWithComments)
  // You can fetch and emit other data as needed

  socket.emit('adminData', {
    activeUsersCount,
    deactiveUsersCount,
    postTitlesWithComments,
    // Add other data fields as needed
  });
};

const getPostTitlesWithComments = async () => {
  // Fetch post titles with total comments
  const posts = await Post.find({});
  const postTitlesWithComments = posts.map(post => ({
    title: post.title,
    totalComments: post.comments.length,
  }));
  return postTitlesWithComments;
};

const sendUserCountUpdates = async (io, UserMongo) => {
    try {
      const activeCount = await UserMongo.countDocuments({ isVerified: true });
      const deactiveCount = await UserMongo.countDocuments({ isVerified: false });
  
      const userCountData = {
        activeCount,
        deactiveCount,
      };
  
      io.emit('userCountUpdate', userCountData);
    } catch (error) {
      console.error('Error counting users:', error);
    }
  };
  
  const sendPostUpdates = async (io, Post) => {
    try {
      const posts = await Post.find().populate({
        path: 'comments',
        select: 'text',
      });
  
      const postsData = posts.map((post) => ({
        title: post.title,
        totalComments: post.comments.length,
      }));
  
      io.emit('postUpdate', postsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };
  
  const simulateUserActivity = (io) => {
    setInterval(async () => {
      try {
        const activityTypes = ['login', 'logout', 'post', 'comment'];
        const randomActivity = activityTypes[Math.floor(Math.random() * activityTypes.length)];
        console.log('randomActivity========',randomActivity)
        console.log('activityTypes')
        if (randomActivity === 'login') {
          console.log('loginnnnnnnnnnnnnnnnnnnnnnnn')
          // Simulate login activity
          const randomUser = await UserMongo.aggregate([{ $match: { isVerified: false } }, { $sample: { size: 1 } }]);
          if (randomUser.length > 0) {
            const user = await UserMongo.findById(randomUser[0]._id);
            console.log('userrrrrrrrrrrr===>',user)
            if (user) {
              console.log('userrrrrrrrrrrr++++++===>',user)
              user.isVerified = true;
              await user.save();
            }
          }
        } else if (randomActivity === 'logout') {
          // Simulate logout activity
          const verifiedUsers = await UserMongo.aggregate([{ $match: { isVerified: true } }, { $sample: { size: 1 } }]);
          if (verifiedUsers.length > 0) {
            const user = await UserMongo.findById(verifiedUsers[0]._id);
            if (user) {
              user.isVerified = false;
              await user.save();
            }
          }
        }
  
        const activeCount = await UserMongo.countDocuments({ isVerified: true });
        const userActivity = {
          type: randomActivity,
          timestamp: new Date().toISOString(),
        };
  
        io.emit('userActivity', userActivity);
        io.emit('userCountUpdate', { activeCount });
      } catch (error) {
        console.error('Error simulating user activity:', error);
      }
    }, 5000); // Simulate every 5 seconds, adjust as needed
  };
  const sendRealTimeUserData = async (io, userId) => {
    try {
      // Fetch real-time user data for the given user
      // Modify this part according to your data structure
      const userData = await UserMongo.findById(userId);
      io.emit('realTimeUserData', userData);
    } catch (error) {
      console.error('Error fetching real-time user data:', error);
    }
  };
  
  const sendRealTimePostData = async (io, userId) => {
    try {
      // Fetch real-time post data for the given user
      // Modify this part according to your data structure
      const postData = await Post.find({ userId }); // Assuming posts are associated with a user
      io.emit('realTimePostData', postData);
    } catch (error) {
      console.error('Error fetching real-time post data:', error);
    }
  };
  
  module.exports = {
    sendUserCountUpdates,
    sendPostUpdates,
    simulateUserActivity,
    sendRealTimeUserData,
    sendRealTimePostData,
    emitAdminData,
    emitUserLogin,
    emitUserLogout
  };
  