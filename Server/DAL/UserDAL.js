var sanitize = require('validator');
var fs = require('fs');

module.exports = function () {
    'use strict';
    function authorize(username, password, callback) {
        username = escape(username);
        //1. Read all nick and passwords from file.
        //TODO. Maybe - Sync function? No..
        fs.readFile('DAL/testDataBase.txt', {encoding: 'utf8'}, function (err, data) {
            //1. If was error - throw error and close application
            if (err) throw err;
            //2. Read and parse all data
            var lines = data.split('\n');
            var ifItValidUser = false;
            for (var i=0; i < lines.length; i++) {
                var parts = lines[i].split(' ');
                var nick = parts[0];
                var userPassword = parts[1];
                //3. Check user nick and password
                if (username === nick)
                {
                    if (password === userPassword) {
                        ifItValidUser = true;
                        callback(null, username);
                        return;
                    }
                    else
                    {
                        var err = new Error('Invalid password! User with this nickname already exist in file and he have another password...spy!');
                        err.status = 401;
                        callback(err);
                        return;
                    }
                }
                //TODO. FOr test
                console.log(nick + "   " + userPassword);
            }
            if (!ifItValidUser) {
                //5. If we didn't find user in file - create!
                fs.appendFile('DAL/testDataBase.txt', username + ' ' + password + '\n', {encoding: 'utf8'}, function (err) {
                    if (err) throw err;
                    //If all ok - go to next step
                    callback(null, username);
                });
            }
        });



        //TODO. Old code with authentication without file and password
   /*     if (username === 'admin' || username === 'user') {
            callback(null, username);
        } else {
            var err = new Error('Invalid credentials');
            err.status = 401;
            callback(err);
        }    */
        //TODO. end old code with

        /*async.waterfall([
         function (callback) {
         User.findOne({login: username}, callback);
         },
         function (user, callback) {
         if (user) {
         return callback(null, user);
         }
         User.findOne({email: username}, callback);
         },
         function (user, callback) {
         if (user) {
         if (user.checkPassword(password)) {
         if (user.isBlocked) {
         return callback(new AuthError('Your account is blocked'));
         }
         callback(null, user);
         } else {
         callback(new AuthError("Incorrect credentials"));
         }
         } else {
         callback(new AuthError("Incorrect credentials"));
         }
         }
         ],
         function (err, user) {
         if (err) {
         if (err instanceof AuthError) {
         return callback(err);
         }
         callback(new AuthError('Some error occured during registration'));
         log.error(err);
         return;
         }
         callback(null, user);
         user.updateLastLoggedIn();
         });*/
    }

    function escape(value) {
        var value = sanitize.escape(value);
        return sanitize.escape(value).trim();
    }

    return {
        authorize: authorize
    };
};

