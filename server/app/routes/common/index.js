var isLoggedIn = function(req, res, next) {
	return (typeof(req.user) != "undefined")
}

var isAdmin = function(req, res, next) {
	return (isLoggedIn(req, res, next) && req.user.admin)
}

module.exports = {
	'isLoggedIn': isLoggedIn,
	'isAdmin': isAdmin
};

