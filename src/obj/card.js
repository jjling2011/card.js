/* global root, gvars, Cache, Lib, call_method, bind_params, Paper */

// card对象

var Card = function (params) {

    Paper.call(this,params);
    bind_params(this, params);
 
};

inherit(Card, Paper);

Card.prototype.name = 'CARD';



