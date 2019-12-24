'use strict';
// express app
const app = require('express')();

app.use(function (req, res, next) {
  req.appName = 'test';
  next();
});

app.get('/', function (req, res) {
  // 1000ms delay added to slow down the rate.
  setTimeout(() =>{
    res.json({username: 'valdemort', full_name: 'Lord Valdemort'})
  }, 1000);
});

module.exports = app;
