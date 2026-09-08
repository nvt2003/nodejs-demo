
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') }); 
 
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  timezone: '+07:00',
  dateStrings: true
};

const pool = mysql.createPool(dbConfig);
pool.on('connection', (connection) => {
  connection.query("SET time_zone = '+07:00';");
});

module.exports = pool;