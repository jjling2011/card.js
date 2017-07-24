/* global Lib */

// 全局设置
var gset = {};

// 缓存fetch中的token用于身份认证.
var token = null;

// 缓存自动生成的id序列号，保证id的唯一性
var cur_serial_id = 0;

var root = window;
var log = root.console.log.bind(root.console);
//var log=function(){};

var Set = function (params) {
    if (!(Lib.type(params) === 'Object')) {
        throw new Error('Error: CardJS.Lib.set( {key1:value1,key2:value2, ... });');
    }
    for (var key in params) {
        gset[key] = params[key];
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
        log('Call undefine method: Card.prototype.funcs.' + fn + '()');
    }
    return false;
}

// 只有card对象使用，以后移进card对象中
// 自动释放通过 card.f.on 绑定的事件。后面的 remove_event 是手动。
function release_event() {
    var key;
    if (this.cjsv.evs.length > 0) {
        //log('before release_event:', this.cjsv.evs);
        var e = this.cjsv.evs;
        for (key in e) {
            e[key] && this.f.off(e[key][0], e[key][1], e[key][2]);
            delete e[key];
        }
        //log('after release_event:', this.cjsv.evs);
        e = null;

    }
    this.cjsv.evs = [];
    for (key in this.cjsv.ev_handler) {
        delete this.cjsv.ev_handler[key];
    }
    key = null;
}


