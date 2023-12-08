const express = require('express');
const { pool, createTableQuery } = require('./src/Config/pgConfig'); // Import PostgreSQL configuration
const { SampleModel } = require('./src/Config/mongoConfig'); // Import MongoDB configuration
const userRoutes = require('./src/Routes/userRoutes');
const app = express();
app.use(express.json())
app.use('/users', userRoutes);
// Your PostgreSQL connection code...

// Your MongoDB (Mongoose) connection code...

// Express route example using PostgreSQL connection
app.get('/postgres', (req, res) => {
  pool.query('SELECT * users', (err, data) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(data.rows);
    }
  });
});




// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});