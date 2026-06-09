const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/CinemaFlow',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

module.exports = pool;
