const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSERNAME,
  host: process.env.PGHOST,
  database: process.env.PGNAME,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT, 
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
  password VARCHAR(100) NOT NULL CHECK (LENGTH(password) BETWEEN 6 AND 12),
  phoneNumber VARCHAR(20) NOT NULL CHECK (phoneNumber ~ '^\d{10}$'),
  created_at TIMESTAMP DEFAULT NOW()
);
`;


// Execute the query
pool.query(createTableQuery, (err, result) => {
    if (err) {
      console.error('Error creating table:', err);
    } else {
      console.log('Table "users" created successfully');
    }
  });

  module.exports = {
    pool,
    createTableQuery,
  };