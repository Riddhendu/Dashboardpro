const GroupMongo = require('../Models/GroupMongo');
const UserMongo = require('../Models/UserMongo');

async function createGroup(req, res) {
  const { title, member } = req.body;

  try {
    const existingGroup = await GroupMongo.findOne({ title });
      
    if (existingGroup) {
      return res.status(400).json({ error: 'Group with this title already exists' });
    }

    // Find users by their IDs to associate them with the group
    const foundMembers = await UserMongo.find({ _id: { $in: member } });
    console.log('foundMembers=========>',foundMembers)
    const newGroup = await GroupMongo.create({ title, member: foundMembers });
    console.log('newGroup=========>',newGroup)
    res.status(201).json({ message: 'Group created successfully', group: newGroup });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function getGroups(req, res) {
  try {
    const groups = await GroupMongo.find({}).populate('member', 'name'); // Populate member details

    res.status(200).json({ message: 'Groups retrieved successfully', groups });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

module.exports = { createGroup, getGroups };
