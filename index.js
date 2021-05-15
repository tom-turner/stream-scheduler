const express = require('express');
const app = express();
const http = require('http').Server(app);

const PORT = process.env.PORT || 5000




app.get('/', function (req, res) {
  res.render('index.ejs');
});

//
// Starting the App
//
const server = http.listen(process.env.PORT || 5000, function() {
  console.log('listening on *:5000');
});