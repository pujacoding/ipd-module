const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root1234',
    database: process.env.DB_NAME || 'ipd_db'
});

db.connect((err) => {
    if (err) {
        console.log("DB Connection Error:", err);
    } else {
        console.log("MySQL Connected");
    }
});

module.exports = db;
