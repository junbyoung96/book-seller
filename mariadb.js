// get the client
const mysql_callback = require('mysql2');
const mysql_promise = require('mysql2/promise');

//callback way
const connection_callback = mysql_callback.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'sprint',
  password: 'root',
  dateStrings: true
});

//promise_way
const connection_promise = async () => {
  const promise = await mysql_promise.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'sprint',
    password: 'root',
    dateStrings: true
  });
};

//connection pool way
const ConnectionPool_callback = mysql_callback.createPool('mysql://root:root@localhost:3306/sprint');
const ConnectionPool_promise = mysql_promise.createPool({
  host: 'localhost',
  user: 'root',
  database: 'sprint',
  password: 'root',
  dateStrings: true,
  connectionLimit: 5
});

module.exports = ConnectionPool_promise;