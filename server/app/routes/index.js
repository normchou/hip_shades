'use strict';
var router = require('express').Router();
module.exports = router;

router.use('/products', require('./product'));
router.use('/categories', require('./category'));
router.use('/brands', require('./brand'));
router.use('/users', require('./user'));
router.use('/search', require('./search'));

// Make sure this is after all of
// the registered routes!
router.use(function (req, res) {
    res.status(404).end();
});


