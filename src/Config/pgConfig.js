const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'newDB',
  password: '1993',
  port: 5432, // PostgreSQL default port
});

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )
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