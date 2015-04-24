'use strict';
var router = require('express').Router();
module.exports = router;

router.use('/product', require('./product'));
router.use('/category', require('./category'));
router.use('/user', require('./user'));
router.use('/order', require('./order'));

// Make sure this is after all of
// the registered routes!
router.use(function (req, res) {
    res.status(404).end();
});
