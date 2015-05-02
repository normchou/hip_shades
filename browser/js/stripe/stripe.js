/**
 * Created by Max on 5/2/15.
 */

angular.module('myApp', ['stripe'])
    .config(function() {
        Stripe.setPublishableKey('pk_test_XKYe1iVrNtGfmcL94oigHBR0');
    })