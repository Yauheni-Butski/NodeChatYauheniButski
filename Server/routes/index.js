var express = require('express');
var UserDAL = require('../DAL/UserDAL');
var router = express.Router();

/* GET main chat room page, if user already authorized */
router.get('/', checkAuth ,function(req, res, next) {
  res.render('index', { title: 'simple chat by Yauheni Butski' });
});

router.get('/error',function(req, res, next) {
  var error = new Error('User with same credentials already in chat room!');
  error.status = 500;
  req.session.destroy();
  next(error);
});

router.post('/logon', function (req, res, next) {
  'use strict';
  var username = req.body.username,
      password = req.body.password;
  console.log('Login attempt: ' + username + ', ' + password);
  var dal = new UserDAL();
  dal.authorize(username, password, function (err, user) {
    if (err) {
      return next(err);
    }
    req.session.user = user;
    res.locals.user = user;
    res.redirect('/');
  });
});

router.post('/logout', function (req, res, next) {
  req.session.destroy();
  res.redirect('/');
})

/* If user not authorized - call it */
function checkAuth(req,res,next){
  if (!req.session.user)
  {
    //Check - if we have unauthorized request - redirect to login page
    res.render('logon',{ title: 'Log on,please!' });
  }
  else
  {
    next();
  }
}


module.exports = router;
