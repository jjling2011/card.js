/* global Lib */

var gvars = {

    // 全局设置
    settings: {},

    // 缓存fetch中的token用于身份认证.
    token: null,

    // 缓存自动生成的id序列号，保证id的唯一性
    cur_serial_id: 0
};


var root = window;
var log = root.console.log.bind(root.console);
//var log=function(){};

var Setup = function (params) {
    if (!(Lib.type(params) === 'Object')) {
        throw new Error('Error: CardJS.Lib.set( {key1:value1,key2:value2, ... });');
    }
    for (var key in params) {
        gvars.settings[key] = params[key];
    }
};

function inherit(SubType, SuperType) {
    if (Object.create) {
        var prototype = Object.create(SuperType.prototype);
        prototype.constructor = SubType;
        SubType.prototype = prototype;
        return;
    }
    function F() {}
    F.prototype = SuperType.prototype;
    var prototype = new F();
    prototype.constructor = SubType;
    SubType.prototype = prototype;
}

// 如果对像中有相应函数就调用，没有就显示一行debug信息。
function call_method(fn, debug) {
    //console.log(this,fn,warn);
    if (fn in this) {
        return(this[fn]());
    }
    if (debug && this.settings.verbose) {
        log('Call undefine method: this.f.' + fn + '()');
    }
    return false;
}

function bind_params(obj, params, skip) {

    var s = ['cid', 'type', 'settings'];

    if (Lib.isArray(skip)) {
        for (var i = 0; i < skip.length; i++) {
            s.push(skip[i]);
        }
    }

    for (var key in params) {
        if (s.indexOf(key) < 0) {
            if (Lib.isFunction(params[key])) {
                obj[key] = params[key].bind(obj);
            } else {
                obj[key] = params[key];
            }
        }
    }
}
