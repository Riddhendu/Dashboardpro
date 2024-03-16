const { createClient } = require('redis');
const UserMongo = require('../Models/UserMongo')
const connectRedis = require("../Config/redisConfig");
// async function retrieveAndShowData() {
//   console.log('Trying to connect to Redis...');
  
 
//    let client = await connectRedis()
//    console.log('connectRedis===========>',client)
//     await client.set('key', 'value');
//     const value = await client.get('key');
//     console.log('value===========>',value)
// }


async function fetchDataFromMongoDB() {
  try {
    const users = await UserMongo.find().exec();
    let client = await connectRedis()
    console.log('connectRedis===========>',client)
    //  await client.set('key', 'value');
     
   await client.set('usersData', JSON.stringify(users), (err, reply) => {
      if (err) {
        console.error('Redis caching error:', err);
      } else {
        console.log('Data cached in Redis');
      }
    }); 
    const value = await client.get('usersData');
    console.log('value===========>',value)
    return users;
  } catch (error) {
    console.error('MongoDB fetch error:', error);
    throw error;
  }
}

async function retrieveAndShowData() {
  try {
    let client = await connectRedis()
  let users =   await client.get('usersData', async (err, data) => {
      if (err) {
        console.error('Redis retrieval error:', err);
      }
      if (data) {
        const users = JSON.parse(data);
        console.log('Data retrieved from Redis cache:');
        console.log(users);
      } else {
        const users = await fetchDataFromMongoDB();
        console.log('Data retrieved from MongoDB:');
        console.log(users);
      }
    });
    console.log('userssssssssssssssssssss++++++++++',users)
    if(!users){
      const users = await fetchDataFromMongoDB();
      console.log('Data retrieved from MongoDB:');
        console.log(users);
    }else{
      console.log('Data retrieved from Redis cache:');
      console.log(JSON.parse(users)); // Parse and log the retrieved data
      return JSON.parse(users); // Return the parsed data
    }
  } catch (error) {
    console.error('Error in retrieving and showing data:', error);
  }
}

module.exports = retrieveAndShowData;
