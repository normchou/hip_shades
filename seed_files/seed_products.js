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
            price: 255.66,
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
            price: 110.49,
            categories: ['Oakley'],
            gender: 'men',
            imageURL: [imageDir + 'frogskin/image1.jpeg', imageDir + 'frogskin/image2.jpeg', imageDir + 'frogskin/image3.jpeg'],
            stock: 10000
        },
        {
            title: 'ClubMaster',
            description: 'Ever been mistaken for a celebrity? Get used to it. Ray-Ban Clubmaster in size 49mm is a semi-rimless black plastic frame with gold detailing and green oval lenses. Fit for the rich and famous. Own this mixed materials style.',
            price: 145.00,
            categories: ['Ray-Ban'],
            gender: 'men',
            imageURL: [imageDir + 'clubmaster/image1.jpeg', imageDir + 'clubmaster/image2.jpeg', imageDir + 'clubmaster/image3.jpeg'],
            stock: 12
        },
        {
            title: 'PO3021S',
            description: 'Handcrafted in Italy, these black, square frames by Persol are a favorite among celebrities. With grey, polarized lenses you\'ll get incredible clarity and reduced glare. The brand\'s patented Meflecto temples offer a secure fit.',
            price: 245.50,
            categories: ['Persol'],
            gender: 'men',
            imageURL: [imageDir + 'PO3021S/image1.jpeg', imageDir + 'PO3021S/image2.jpeg', imageDir + 'PO3021S/image3.jpeg'],
            stock: 50,
            promotion_item: true
        },
        {
            title: 'Leo',
            description: 'Leo is a shiny wayfarer style with shiny metal signature \'T\' logo on each temple. Lenses provide 100% UVA/UVB protection.',
            price: 345.32,
            categories: ['Tom Ford'],
            gender: 'women',
            imageURL: [imageDir + 'leo/image1.jpeg', imageDir + 'leo/image2.jpeg', imageDir + 'leo/image3.jpeg'],
            stock: 50
        },
        {
            title: 'AX4008',
            description: 'A/X is fast fashion. A line that redefines the essentials of the Armani style through a sophisticated use of urban style, these sunglasses are for the young and contemporary.',
            price: 100.90,
            categories: ['Armani Exchange'],
            gender: 'women',
            imageURL: [imageDir + 'AX4008/image1.jpeg', imageDir + 'AX4008/image2.jpeg', imageDir + 'AX4008/image3.jpeg'],
            stock: 50
        },
        {
            title: 'Kristina',
            description: 'A classic pilot by Coach, Kristina is the epitome of American style. The lozenge logo is complimented with iconic Coach patterns like the Legacy Stripe, which is made of an exclusive acetate. Each temple tip features a signature grommet.',
            price: 188.99,
            categories: ['Coach'],
            gender: 'women',
            imageURL: [imageDir + 'kristina/image1.jpeg', imageDir + 'kristina/image2.jpeg', imageDir + 'kristina/image3.jpeg'],
            stock: 50
        },
        {
            title: 'L111',
            description: 'Coach Eyewear is a quality lifestyle accessory offering classic American design and functionality. The Coach Eyewear Collection consists of modern designs with trend-right frames and lens colors developed to match every face tone. Lenses are made from the highest-quality materials, provide 100% UV protection, and are optically correct and distortion free.',
            price: 180.00,
            categories: ['Coach'],
            gender: 'women',
            imageURL: [imageDir + 'L111/image1.jpeg', imageDir + 'L111/image2.jpeg', imageDir + 'L111/image3.jpeg'],
            stock: 50
        },
        {
            title: 'Linea Rossa',
            description: 'Spotted: An A-lister must-have style. The gunmetal frame with grey polarized lenses is the perfect combination of luxury and lifestyle. It\'s a refined frame that maintains its sporty touch.',
            price: 380.95,
            categories: ['Prada'],
            gender: 'women',
            imageURL: [imageDir + 'lineaRossa/image1.jpeg', imageDir + 'lineaRossa/image2.jpeg', imageDir + 'lineaRossa/image3.jpeg'],
            stock: 49,
            promotion_item: true
        },
        {
            title: 'Original Aviator',
            description: 'Aviator sunglasses have the timeless look with the unmistakable teardrop shaped lenses. Featuring silver frames and blue lenses, this small metal aviator style in size 55mm allowed the look to quickly spread beyond their utility becoming popular among celebrities, rock stars and citizens of the world alike.',
            price: 359.00,
            categories: ['Ray-Ban'],
            gender: 'men',
            imageURL: [imageDir + 'originalAviator/image1.jpeg', imageDir + 'originalAviator/image2.jpeg', imageDir + 'originalAviator/image3.jpeg'],
            stock: 10
        },
        {
            title: 'Original Aviator',
            description: 'This is the style that started it all. The original Ray-Ban metal aviator in gold with green, polarized lenses that keep undesirable light from reaching your eyes. Ray-Ban consistently combines great styling with exceptional quality, performance and comfort in size 58mm.',
            price: 199.95,
            categories: ['Ray-Ban'],
            gender: 'men',
            imageURL: [imageDir + 'originalAviator2/image1.jpeg', imageDir + 'originalAviator2/image2.jpeg', imageDir + 'originalAviator2/image3.jpeg'],
            stock: 10
        },
        {
            title: 'Slide',
            description: 'When things get extreme, this sleek wrap will absolutely have your back. Green lenses filter out light and boost visibility, while matte black frames and a lightly upswept shape add fresh style and easy wearability.',
            price: 79.95,
            categories: ['Arnette'],
            gender: 'men',
            imageURL: [imageDir + 'slide/image1.jpeg', imageDir + 'slide/image2.jpeg', imageDir + 'slide/image3.jpeg'],
            stock: 102
        },
        {
            title: 'Stickup',
            description: 'Founded in 1992, Arnette quickly became the leader in action sport and youth lifestyle eyewear. Arnette is dedicated to progressive design, maximum functionality and unparalleled quality. Supported by a powerful roster of athletes, Arnette continues to be the leading choice in action-sports eyewear.',
            price: 179.95,
            categories: ['Arnette'],
            gender: 'men',
            imageURL: [imageDir + 'stickup/image1.jpeg', imageDir + 'stickup/image2.jpeg', imageDir + 'stickup/image3.jpeg'],
            stock: 35
        },
        {
            title: 'Whitney',
            description: 'The Tom Ford Whitney counts as one of the most sought-after sunglasses. Its foremost characteristic is its high glamour factor that will put you straight into the limelight. The almost circular full border brown frame with its criss-cross signature design creates the mathematical symbol for infinity, making this style an unmistakable unique asset of the fashion industry that is extremely recognizable. Angelina Jolie, Gwen Stefani, Keira Knightley and Charlize Theron are all on the long list of those who could not resist the Tom Ford Whitney. The stylish cut-outs and metal inserts on the temples give rise to a great style. In addition to its design features, the brown gradient lenses provide maximum protection against the harmful UV rays.',
            price: 179.95,
            categories: ['Tom Ford'],
            gender: 'women',
            imageURL: [imageDir + 'whitney/image1.jpeg', imageDir + 'whitney/image2.jpeg', imageDir + 'whitney/image3.jpeg'],
            stock: 33
        },
        {
            title: 'PR 57LS',
            description: 'You\'re good as gold in this sexy shield. Prada\'s gunmetal frame, grey gradient lenses and noteworthy accents has you striking it rich.',
            price: 300.95,
            categories: ['Prada'],
            gender: 'women',
            imageURL: [imageDir + 'PR57LS/image1.jpeg', imageDir + 'PR57LS/image2.jpeg', imageDir + 'PR57LS/image3.jpeg'],
            stock: 33,
            promotion_item: true
        },
        {
            title: 'JV796',
            description: 'John Varvatos Eyewear is the perfect balance of luxury and casual. With rock ?n roll roots, the collection features vintage-inspired silhouettes and impeccable details. Comfort and fit are integral to the design, with newly engineered concealed spring hinges that allow for flexibility and strength. It?s classic style with a signature edge.',
            price: 430.95,
            categories: ['John Varvatos'],
            gender: 'women',
            imageURL: [imageDir + 'JV796/image1.jpeg', imageDir + 'JV796/image2.jpeg', imageDir + 'JV796/image3.jpeg'],
            stock: 3
        },
        {
            title: 'Tailpin',
            description: 'Devoted to making the best sunglasses on the planet by letting invention lead the way. With a passion to reinvent from scratch, Oakley sunglasses defy convention and set the standard for design, performance, and protection by wrapping innovation in art.',
            price: 200.95,
            categories: ['Oakley'],
            gender: 'men',
            imageURL: [imageDir + 'tailpin/image1.jpeg', imageDir + 'tailpin/image2.jpeg', imageDir + 'tailpin/image3.jpeg'],
            stock: 3
        },
        {
            title: 'Linea Rossa',
            description: 'Research, technology and design.  Technically advanced products that marry elegance and attention to detail, with a high level of comfort for both lifestyle and sports environments: this is the Prada Linea Rossa Eyewear approach.',
            price: 380.95,
            categories: ['Prada'],
            gender: 'men',
            imageURL: [imageDir + 'lineaRossa2/image1.jpeg', imageDir + 'lineaRossa2/image2.jpeg', imageDir + 'lineaRossa2/image3.jpeg'],
            stock: 49
        },
        {
            title: 'Linea Rossa',
            description: 'Experience the durable protection and all-day comfort of Prada Linea Rossa. Made using only top-of-the-line materials and construction, the polarized lenses and stylish frame provide you with the perfect pair of sunglasses.',
            price: 380.95,
            categories: ['Prada'],
            gender: 'men',
            imageURL: [imageDir + 'lineaRossa3/image1.jpeg', imageDir + 'lineaRossa3/image2.jpeg', imageDir + 'lineaRossa3/image3.jpeg'],
            stock: 49
        },
        {
            title: 'Round Metal',
            description: 'The Ray-Ban RB3447 sunglasses are totally retro. This look has been worn by legendary musicians and inspired by the 1960s counter-culture when this style first originated.The Ray-Ban unisex metal, iconic sunglasses are known for their defined round crystal lenses and distinct shape. A curved brow bar, adjustable nose pads, and thin metal temples with plastic end tips rest comfortably behind the ears. In addition to the classic and gradient lenses, the Round Metal is now available with striking flash lenses, to ensure you never go unnoticed.',
            price: 199.95,
            categories: ['Ray-Ban'],
            gender: 'women',
            imageURL: [imageDir + 'roundMetal/image1.jpeg', imageDir + 'roundMetal/image2.jpeg', imageDir + 'roundMetal/image3.jpeg'],
            stock: 49,
            promotion_item: true
        },
        {
            title: 'Original Aviator',
            description: 'Coolness enters a new realm with flash polarized lenses. For the first time, Ray-Ban launches lenses that combine the mirror multi-layer treatment with polarized technology. Iconic shapes with must-have style.',
            price: 199.95,
            categories: ['Ray-Ban'],
            gender: 'women',
            imageURL: [imageDir + 'originalAviator3/image1.jpeg', imageDir + 'originalAviator3/image2.jpeg', imageDir + 'originalAviator3/image3.jpeg'],
            stock: 49
        },
        {
            title: 'Flak Jacket',
            description: 'A larger version of the FLAK JACKET ™ the XLJ also has interchangeable lens designs with unbeatable optical clarity. FLAK JACKET XLJ ® sunglasses feature Oakley HYDROPHOBIC ™ a permanent lens coating that prevents lens smudges and build up. Multiple High Definition Optics ® lens colors are available. Frames are made of lightweight O MATTER ® for all-day comfort and pure PLUTONITE ® lens material filters out 100% of all UV rays.',
            price: 370.95,
            categories: ['Oakley'],
            gender: 'men',
            imageURL: [imageDir + 'flakJacket/image1.jpeg', imageDir + 'flakJacket/image2.jpeg', imageDir + 'flakJacket/image3.jpeg'],
            stock: 9
        }
    ];

    return q.invoke(Product, 'create', products);
}

module.exports = seedProducts;

