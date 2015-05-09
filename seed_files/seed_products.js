/*

This seed file seeds products into the database.

*/

var mongoose = require('mongoose');
var connectToDb = require('./../server/db');
var Product = mongoose.model('Product');
var q = require('q');
var imageDir = './product_images/'; 

var seedProducts = function () {
    
    var products = [
        {
            title: 'Pulse',
            description: 'Fashion frame with sporty wrap. Carved from lightweight, stress-resistant O Matter ®, these frames are comfy with a Three-Point Fit and hydrophilic Unobtainium ® earpads and nosepads for a snug, secure fit. The beautifully curved stems ensure a fabulous look.',
            price: 130.00,
            categories: ['Oakley'],
            gender: 'women',
            imageURL: [imageDir + 'pulse/image1.jpeg', imageDir + 'pulse/image2.jpeg', imageDir + 'pulse/image3.jpeg'],
            stock: 0
        },
        {
            title: 'Glare',
            description: 'The hallmark styling of this world-renowned fashion leader denotes high quality with a dedication to innovation and a strong tradition of craftsmanship. Prada is synonymous with an understated style that has always anticipated, and often dictated, new trends. Prada sunglasses use only the finest materials to strike the ideal balance of form and function.',
            price: 255.00,
            categories: ['Prada'],
            gender: 'women',
            imageURL: [imageDir + 'glare/image1.jpeg', imageDir + 'glare/image2.jpeg', imageDir + 'glare/image3.jpeg'],
            stock: 50
        },
        {
            title: 'Wayfarer',
            description: 'The new Ray-Ban Wayfarer sunglasses are a slightly smaller interpretation-size 52mm-on the most famous style in sunwear. The Ray-Ban signature logo is still displayed on sculpted temples, but the new Wayfarer flaunts a softer eye shape than the original and offers both classic and fashion bright color options. This updated version comes with a stylish black frame and green polarized lenses, providing ultimate clarity and enhanced vision.',
            price: 179.95,
            categories: ['Ray-Ban'],
            gender: 'men',
            imageURL: [imageDir + 'wayfarer/image1.jpeg', imageDir + 'wayfarer/image2.jpeg', imageDir + 'wayfarer/image3.jpeg'],
            stock: 5
        },
        {
            title: 'Frogskin',
            description: 'In pop culture, it was a time like no other. Ronald Reagan was in the White House, The Terminator was in the box office and Run DMC was in certified gold. It was also the time when Oakley created one-of-a-kind sunglasses called Frogskins. Oakley resurrected the original tooling from the 1980s giving you a chance to own a piece of history. The black square frame has purple, mirrored lenses.',
            price: 110.00,
            categories: ['Oakley'],
            gender: 'men',
            imageURL: [imageDir + 'frogskin/image1.jpeg', imageDir + 'frogskin/image2.jpeg', imageDir + 'frogskin/image3.jpeg'],
            stock: 10000
        },
        {
            title: 'Ames',
            description: 'With a bold browline and generous width, Ames transitions easily from mornings in the quad to nights on the town.',
            price: 145.00,
            categories: ['Warby Parker'],
            gender: 'men',
            imageURL: [imageDir + 'ames/image1.jpeg', imageDir + 'ames/image2.jpeg', imageDir + 'ames/image3.jpeg'],
            stock: 100
        }
    ];

    return q.invoke(Product, 'create', products);
}

module.exports = seedProducts;

