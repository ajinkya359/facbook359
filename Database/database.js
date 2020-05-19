const mysql = require('mysql')

const mysqlConnection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "ajinkya5555",
    database: "SocialMedia"
});

mysqlConnection.connect(err => {
    if (err) console.log(err);
    else console.log("Database is Connected");
})

module.exports = mysqlConnection;