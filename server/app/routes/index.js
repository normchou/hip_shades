'use strict';
var router = require('express').Router();
module.exports = router;

router.use('/products', require('./product'));
router.use('/categories', require('./category'));
router.use('/users', require('./user'));

// Make sure this is after all of
// the registered routes!
router.use(function (req, res) {
    res.status(404).end();
});


