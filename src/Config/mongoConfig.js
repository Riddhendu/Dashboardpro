const mongoose = require("mongoose");

    
   const host = process.env.DATABASE_URL

const connectDatabase = () => {
  mongoose
    .connect(host, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((data) => {
      console.log(`Mongodb connected with server: ${host}`);
    }).catch((err) => {
        console.error('Error connecting to MongoDB:', err);
      });
};

module.exports = connectDatabase;