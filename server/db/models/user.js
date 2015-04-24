'use strict';
var crypto = require('crypto');
var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    first_name:{
        type: String,
        required: true
    },
    last_name:{
        type: String,
        required: true
    },
    admin:{
        type: Boolean,
        required: true,
        default: false
    },
    street:{
        type: String,
        required: false
    },
    state:{
        type: String, //This will be drop-down. To be updated in the future.
        required: false //Required if your country is US
    },
    country:{
        type: String, //This will be drop-down.
        default: 'US',
        required: false
    }
});

userSchema.methods.getOrders = function() {
	return mongoose.model('Order').find({user_ref: this._id}).exec();
}

// generateSalt, encryptPassword and the pre 'save' and 'correctPassword' operations
// are all used for local authentication security.
var generateSalt = function () {
    return crypto.randomBytes(16).toString('base64');
};

var encryptPassword = function (plainText, salt) {
    var hash = crypto.createHash('sha1');
    hash.update(plainText);
    hash.update(salt);
    return hash.digest('hex');
};

userSchema.pre('save', function (next) {

    if (this.isModified('password')) {
        this.salt = this.constructor.generateSalt();
        this.password = this.constructor.encryptPassword(this.password, this.salt);
    }

    next();

});

userSchema.statics.generateSalt = generateSalt;
userSchema.statics.encryptPassword = encryptPassword;

userSchema.method('correctPassword', function (candidatePassword) {
    return encryptPassword(candidatePassword, this.salt) === this.password;
});

userSchema.method('getReviews', function () {
    return mongoose.model('Review').find({ userID: this._id }).exec();
});

userSchema.method('getOrderHistory', function () {
    return mongoose.model('Order').find({ user_ref: this._id }).exec();
});

userSchema.path('email').validate(function(email) {
    var emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
    return emailRegex.test(email); // Assuming email has a text attribute
}, "E-mail must be in correct form");

var User = mongoose.model('User', userSchema);

module.exports = {"User": User};
