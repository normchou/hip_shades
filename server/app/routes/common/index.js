var isLoggedIn = function(req, res, next) {
	return (typeof(req.user) != "undefined")
}

var isAdmin = function(req, res, next) {
	return (isLoggedIn(req, res, next) && req.user.admin)
}

var needAdminPrivileges = function(req, res, next) {
	if (!isAdmin(req, res, next))
		res.status(403).send('Thou shalt not pass');
	else
		next();
}

var needUserLoggedIn = function (req, res, next) {
	if (!isLoggedIn(req, res, next))
		res.status(403).send('User not logged in');
	else
		next();
}

module.exports = {
	'isLoggedIn': isLoggedIn,
	'isAdmin': isAdmin,
	'needAdminPrivileges': needAdminPrivileges,
	'needUserLoggedIn': needUserLoggedIn	
};

