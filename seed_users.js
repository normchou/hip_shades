/*

This seed file seeds users into the database.

*/

var mongoose = require('mongoose');
var connectToDb = require('./server/db');
var User = mongoose.model('User');
var q = require('q');

var seedUsers = function () {

    var users = [
        {
            first_name: 'jon',
            last_name: 'doe',
            email: 'testing@fsa.com',
            password: 'password'
        },
        {
            first_name: 'barack',
            last_name: 'obama',
            email: 'obama@gmail.com',
            password: 'potus'
        }
    ];

    return q.invoke(User, 'create', users);

};

module.exports = seedUsers;