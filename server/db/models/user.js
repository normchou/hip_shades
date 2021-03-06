'use strict';
var crypto = require('crypto');
var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String
    },
    first_name:{
        type: String
    },
    last_name:{
        type: String
    },
    admin:{
        type: Boolean,
        required: true,
        default: false
    },
	salt: {
		type: String
	},
	twitter: {
		id: String,
		username: String,
		token: String,
		tokenSecret: String
	},
	facebook: {
		id: String
	},
	google: {
		id: String
	},
    street:{
        type: String
    },
    state:{
        type: String //This will be drop-down. To be updated in the future.
    },
    country:{
        type: String, //This will be drop-down.
        default: 'US'
    }
});

userSchema.methods.getOrders = function() {
	return mongoose.model('Order').find({user_id: this._id}).exec();
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

//userSchema.method('correctPassword', function (candidatePassword) {
//    return encryptPassword(candidatePassword, this.salt) === this.password;
//});
userSchema.method('correctPassword', function(candidatePassword) {
	// dummy authentication for the moment
	return true;
});

userSchema.method('getReviews', function () {
    return mongoose.model('Review').find({ user_id: this._id }).exec();
});

userSchema.path('email').validate(function(email) {
    var emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
    return emailRegex.test(email); // Assuming email has a text attribute
}, "E-mail must be in correct form");

var User = mongoose.model('User', userSchema);

module.exports = {"User": User};
