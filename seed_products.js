/*

This seed file seeds products into the database.

*/

var mongoose = require('mongoose');
var connectToDb = require('./server/db');
var Product = mongoose.model('Product');
var q = require('q');

var seedProducts = function () {
    
    var products = [
        {
            title: 'Pulse',
            description: 'Fashion frame with sporty wrap. Carved from lightweight, stress-resistant O Matter ®, these frames are comfy with a Three-Point Fit and hydrophilic Unobtainium ® earpads and nosepads for a snug, secure fit. The beautifully curved stems ensure a fabulous look.',
            price: 130.00,
            category: ['Oakley', 'women'],
            imageURL: 'http://s7d3.scene7.com/is/image/LuxotticaRetail/700285704289_shad_qt??$m_pdpSet$&layer=0&color=F3F2F2&wid=1100',
            reviews: []
        },
        {
            title: 'Glare',
            description: 'The hallmark styling of this world-renowned fashion leader denotes high quality with a dedication to innovation and a strong tradition of craftsmanship. Prada is synonymous with an understated style that has always anticipated, and often dictated, new trends. Prada sunglasses use only the finest materials to strike the ideal balance of form and function.',
            price: 255.00,
            category: ['Prada', 'women'],
            imageURL: 'http://s7d3.scene7.com/is/image/LuxotticaRetail/8053672383966_shad_qt??$m_pdpSet$&layer=0&color=F3F2F2&wid=1100',
            reviews: [] 
        },
        {
            title: 'Wayfarer',
            description: 'The new Ray-Ban Wayfarer sunglasses are a slightly smaller interpretation-size 52mm-on the most famous style in sunwear. The Ray-Ban signature logo is still displayed on sculpted temples, but the new Wayfarer flaunts a softer eye shape than the original and offers both classic and fashion bright color options. This updated version comes with a stylish black frame and green polarized lenses, providing ultimate clarity and enhanced vision.',
            price: 179.95,
            category: ['Ray-Ban', 'men'],
            imageURL: 'http://s7d3.scene7.com/is/image/LuxotticaRetail/8053672131581_shad_qt??$m_pdpSet$&layer=0&color=F3F2F2&wid=1100',
            reviews: []
        },
        {
            title: 'Frogskin',
            description: 'In pop culture, it was a time like no other. Ronald Reagan was in the White House, The Terminator was in the box office and Run DMC was in certified gold. It was also the time when Oakley created one-of-a-kind sunglasses called Frogskins. Oakley resurrected the original tooling from the 1980s giving you a chance to own a piece of history. The black square frame has purple, mirrored lenses.',
            price: 110.00,
            category: ['Oakley', 'men'],
            imageURL: 'http://s7d3.scene7.com/is/image/LuxotticaRetail/700285551371_shad_qt??$m_pdpSet$&layer=0&color=F3F2F2&wid=1100',
            reviews: []
        }
    ]

    return q.invoke(Product, 'create', products);
}

module.exports = seedProducts;

