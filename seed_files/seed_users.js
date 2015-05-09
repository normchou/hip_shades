/*

This seed file seeds users into the database.

*/

var mongoose = require('mongoose');
var connectToDb = require('./../server/db');
var User = mongoose.model('User');
var q = require('q');

var seedUsers = function () {

    var users = [
        {
            first_name: 'Ramnik',
            last_name: 'Arora',
            email: 'ramnikarora@gmail.com',
            password: 'password',
			salt: 'littleExtra',
			facebook: {id: 512375944550},
			admin: true
        },
        {
            first_name: 'Barak',
            last_name: 'Obama',
            email: 'obama@gmail.com',
            password: 'potus',
            street: '1600 Penn ave',
            state: 'WA',
            country: 'US'
        },
        {
            first_name: 'Max',
            last_name: 'Kayan',
            email: 'max@gmail.com',
            password: 'mathematicalMax',
            admin: true
        },
        {
            first_name: 'Victor',
            last_name: 'Atteh',
            email: 'victor@gmail.com',
            password: 'victoriousVictor',
            admin: true,
			facebook: {id: 847770321927033},
            street: '123 fake st',
            state: 'CT',
            country: 'US'
        },
        {
            first_name: 'Jon',
            last_name: 'Doe',
            email: 'jon@gmail.com',
            password: 'password',
            street: '124 fake ave',
            state: 'AZ',
            country: 'US'
        },
        {
            first_name: 'Taylor',
            last_name: 'Miller',
            email: 'taylor@gmail.com',
            password: 'password',
            street: '124 fake lane',
            state: 'CT',
            country: 'US'
        },
        {
            first_name: 'Allen',
            last_name: 'Wilson',
            email: 'allen@gmail.com',
            password: 'password',
            street: '124 fake drive',
            state: 'CA',
            country: 'US'
        },
        {
            first_name: 'Scott',
            last_name: 'Harris',
            email: 'scott@gmail.com',
            password: 'password',
            street: '124 fake street',
            state: 'WA',
            country: 'US'
        },
        {
            first_name: 'Murph',
            last_name: 'Carter',
            email: 'murph@gmail.com',
            password: 'password',
            street: '124 fake place',
            state: 'NY',
            country: 'US'
        },
        {
            first_name: 'Kelly',
            last_name: 'Stewart',
            email: 'kelly@gmail.com',
            password: 'password',
            street: '128 fake lane',
            state: 'FL',
            country: 'US'
        },
        {
            first_name: 'Kim',
            last_name: 'Hamilton',
            email: 'kim@gmail.com',
            password: 'password',
            street: '138 fake drive',
            state: 'FL',
            country: 'US'
        }


    ];

    return q.invoke(User, 'create', users);

};

module.exports = seedUsers;
