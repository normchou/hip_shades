var dbURI = 'mongodb://localhost:27017/testingDB';
var clearDB = require('mocha-mongoose')(dbURI);

var sinon = require('sinon');
var expect = require('chai').expect;
var mongoose = require('mongoose');

require('../../../server/db/models/product');

var Product = mongoose.model('Product');

describe('Product model', function () {

    beforeEach('Establish DB connection', function (done) {
        if (mongoose.connection.db) return done();
        mongoose.connect(dbURI, done);
    });

    var product;
    beforeEach(function() {
        product = new Product();
    });


    afterEach('Clear test database', function (done) {
        clearDB(done);
    });

    it('should exist', function () {
        expect(Product).to.be.a('function');
    });

    describe('Validation', function () {
        it('should be required', function(done) {
            product.validate(function(err) {
                expect(err.errors.title.type).to.equal('required')
                done();
            })
        })
    })

    describe('Statics', function() {
        describe('getByGender', function() {          
            beforeEach(function(done) {
                Product.create({
                    title: 'Shades',
                    price: 100,
                    gender: 'men',
                    stock: 20
                }, done)
            });
            it('should get product with gender match', function(done) {
                Product.getByGender('men', function(err, data) {
                    expect(data).to.have.lengthOf(1);
                    done();
                })
            })
        
        })
    });

});



















