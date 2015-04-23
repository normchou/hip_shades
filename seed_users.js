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
            password: 'potus',
            street: '1600 Penn ave',
            state: 'WA',
            country: 'US'
        },
        {
            first_name: 'max',
            last_name: 'kayan',
            email: 'max@gmail.com',
            password: 'mathematicalMax',
            admin: true
        },
        {
            first_name: 'victor',
            last_name: 'atteh',
            email: 'victor@gmail.com',
            password: 'victoriousVictor',
            admin: false,
            street: '123 fake st',
            state: 'CT',
            country: 'US'
        }

    ];

    return q.invoke(User, 'create', users);

};

module.exports = seedUsers;