const Post = require('../Models/PostMongo');
const UserMongo = require('../Models/UserMongo');
async function createPost(req, res) {
  const { title, description, permissionType, allowedGroups } = req.body;

  try {
    let newPost;

    if (permissionType === 'group' && allowedGroups && allowedGroups.length > 0) {
      // If permission type is group, associate the post with allowed groups
      newPost = await Post.create({
        title,
        description,
        permissionType,
        allowedGroups,
      });
    } else if (permissionType === 'all') {
      // If permission type is all, allow the post for everyone
      newPost = await Post.create({
        title,
        description,
        permissionType,
      });
    } else {
      return res.status(400).json({ error: 'Invalid permission type or missing allowed groups' });
    }

    res.status(201).json({ message: 'Post created successfully', post: newPost });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function getPosts(req, res) {
  try {
    const user = req.user;
    console.log('user==============uiyuiyuiy>',user)
    let posts = [];
    posts = await Post.find({});
 if(user.userType === 'Normal') {
      posts = await Post.find({permissionType: 'group', allowedGroups: { $in: user._id } });
      console.log('post===============>',posts)
      // if(posts.length == 0){
      //   posts = await Post.find({}); 
      // }
    }

    res.status(200).json({ message: 'Posts retrieved successfully', posts });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}


async function addComment(req, res) {
  const user = req.user;
  const postId = req.params.postId;
  const { text } = req.body;

  try {
    const post = await Post.findById(postId);
    let posts = [];
    posts = await Post.find({_id:postId,permissionType: 'group', allowedGroups: { $in: user._id } });
    if(posts.length == 0){
      return res.status(404).json({ error: 'you are not allowed to comment' });
    }
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.comments.push({
      user: req.user._id,
      text,
    });

    await post.save();

    res.status(200).json({ message: 'Comment added successfully', post });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

module.exports = { createPost, getPosts, addComment };
