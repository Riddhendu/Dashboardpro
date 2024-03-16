const { createClient } = require('redis');

const connectRedis = async() =>{
    const client =await  createClient({
        password: 'dGEvhPSfEEhLJZk6wLZDcdUIqaTsCWu8',
        socket: {
            host: 'redis-19390.c326.us-east-1-3.ec2.cloud.redislabs.com',
            port: 19390
        }
      })
        .on('error', err => console.log('Redis Client Error', err))
        .on('connect', response => console.log('Redis Client connected'))
        .connect();
        return client
}

module.exports = connectRedis;