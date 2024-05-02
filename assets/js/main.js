$(document).ready(function(){

    'use strict';

    const navTarget = $('#navTarget');
    const navOpenBtn = $('#navToggle').find('.open');
    const navCloseBtn = $('#navToggle').find('.close');

    navOpenBtn.click(function(){
        navTarget.slideDown(500);
        navCloseBtn.show();
        navOpenBtn.hide();
    });

    navCloseBtn.click(function(){
        navTarget.slideUp(500);
        navOpenBtn.show();
        navCloseBtn.hide();
    });

});
