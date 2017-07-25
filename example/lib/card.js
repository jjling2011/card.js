// https://github.com/jjling2011/card.js
// GPL-3.0

/* global define */

(function (name, context, definition) {
    // copy from https://github.com/ded/qwery/blob/master/src/qwery.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = definition();
    } else if (typeof define === 'function' && define.amd) {
        define(function () {
            return definition();
        });
    } else {
        context[name] = definition();
    }
})('cardjs', this, function () {

    "use strict";

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

var Set = function (params) {
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
        log('Call undefine method: Card.prototype.funcs.' + fn + '()');
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

// 只有card对象使用，以后移进card对象中
// 自动释放通过 card.f.on 绑定的事件。后面的 remove_event 是手动。
function release_event() {
    var key;

    for (var key in this.cjsv.timer) {
        this.f.clear_timer(key);
    }

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


/* global root */

var Lib = {
    expand: function () {
        if (arguments.length < 1) {
            throw new Error('Error: Lib.expand(obj1, obj2, ... )');
        }
        var o = arguments[0];
        if (!(Lib.isObject(o))) {
            throw new Error('Error: Lib.expand() first param should be {} or []');
        }

        for (var i = 1; i < arguments.length; i++) {
            var e = arguments[i];
            if (Lib.isObject(e)) {
                for (var key in e) {
                    o[key] = e[key];
                }
            }
        }
        o = null;
        e = null;
    },
    encode_utf8: function (text_utf8) {
        //对应 php decode:
        // $txt_utf8 = urldecode(base64_decode($txt_b64));
        //return root.btoa(root.encodeURIComponent(text_utf8));
        return root.encodeURIComponent(text_utf8);
    },
    decode_utf8: function (text_base64) {
        // 对应 php encode: 
        // $txt_b64 =base64_encode(rawurlencode($txt_utf8));
        // **** 注意是带raw三个字母 **** 
        // 不要问为什么！记住php是世界上最好的语言就对了！！
        //return (root.decodeURIComponent(root.atob(text_base64)));
        return (root.decodeURIComponent(text_base64));
    },
    load_html: function (id) {
        return(root.document.getElementById(id).innerHTML);
    },
    get_elsbyname: function (name) {
        return (root.document.getElementsByName(name));
    },
    pad: function (n, width, leading_str) {
        var z = leading_str || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    },
    clamp: function (val, min, max) {
        return root.Math.min(root.Math.max(val, min), max);
    },
    html_escape: function (unsafe) {
        if (!unsafe || unsafe.length === 0) {
            return '';
        }
        return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
    },
    array_remove_all: function (arr, value) {
        if (!Lib.isArray(arr)) {
            throw new Error('Error: arr is not an array!');
        }
        for (var i = arr.length; i >= 0; --i) {
            if (arr[i] === value) {
                arr.splice(i, 1);
            }
        }
    },
    array_cut_tail: function (arr, len) {
        if (!Lib.isArray(arr)) {
            throw new Error('Error: arr is not an array!');
        }
        len = len || 25;
        while (arr.length > len) {
            arr.pop();
        }
    },
    array_unshift: function (arr, el, len) {
        if (!Lib.isArray(arr)) {
            throw new Error('Error: arr is not an array!');
        }
        len = len || 25;
        Lib.array_remove_all(el);
        arr.unshift(el);
        Lib.array_cut_tail(arr);
    },
    rand: function (len) {
        len = len || 32;
        var chars = 'abcdefghijklmnopqrstuvwxyz'
                + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                + '0123456789';
        var maxPos = chars.length;
        var rtv = '';
        for (var i = 0; i < len; i++) {
            rtv += chars.charAt(root.Math.floor(root.Math.random() * maxPos));
        }
        return rtv;
    },
    get_DOM_offset: function (el) {
        var left, top, rect;
        rect = el.getBoundingClientRect();
        var sx = (root.pageXOffset !== undefined)
                ? root.pageXOffset
                : (root.document.documentElement || root.document.body.parentNode || root.document.body).scrollLeft;

        var sy = (root.pageYOffset !== undefined)
                ? root.pageYOffset
                : (root.document.documentElement || root.document.body.parentNode || root.document.body).scrollTop;

        left = rect.left + sx + rect.width;
        top = rect.top + sy + rect.height;
        //log('rect:', rect, ' root.sx/sy:', root.scrollX, root.scrollY, ' left/top:', left, top);
        el = null;
        rect = null;
        return {
            left: left,
            top: top
        };
    },
    url_get_page: function () {
        var url = root.document.location.href;
        url = url.substring(0, (url.indexOf("#") === -1) ? url.length : url.indexOf("#"));
        url = url.substring(0, (url.indexOf("?") === -1) ? url.length : url.indexOf("?"));
        url = url.substring(url.lastIndexOf("/") + 1, url.length);
        return url;
    },
    url_set_params: function (page, params) {
        params = params || {};
        //log('url_set_param:',page,params);
        if (root.history.pushState) {
            var pstr = '', dl = '?';
            for (var key in params) {
                pstr += dl + key + '=' + params[key];
                dl = '&';
            }
            root.history.pushState({}, null, page + pstr);
        }
    },
    url_get_param: function (name) {
        var url = root.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
        regex = null;
        if (!results || !results[2]) {
            return false;
        }
        return root.decodeURIComponent(results[2].replace(/\+/g, " "));
    },
    type: function (obj) {
        return Object.prototype.toString.call(obj).slice(8, -1);
    },
    getYMD: function (date_str) {
        //var date_str = "2011-08-03 09:15:11"; 
        var d = date_str.split(" ");
        if (d && d[0]) {
            return d[0];
        }
        return 'none';
    },
    getTime: function (date_str) {
        var d = date_str.split(" ");
        if (d && d[1]) {
            return d[1];
        }
        return 'none';
    },
    cookie_set: function (name, value, expires) {
        //默认一年,expires默认一个月
        expires = expires || 30 * 24 * 60 * 60;
        expires = expires * 1000;
        var exp = new Date(), str;  //获得当前时间  
        exp.setTime(exp.getTime() + expires);  //换成毫秒  
        str = name + "=" + root.escape(value) + ";expires=" + exp.toGMTString();
        exp = null;
        root.document.cookie = str;
    },
    cookie_get: function (name) {
        var arr = root.document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
        if (arr !== null) {
            var r = arr[2];
            arr = null;
            return root.unescape(r);
        } else {
            return "";
        }
    },
    cookie_del: function (name) {
        var exp = new Date();  //当前时间  
        exp.setTime(exp.getTime() - 1);
        var cval = Lib.cookie_get(name);
        var r = name + "=" + cval + ";expires=" + exp.toGMTString();
        exp = null;
        if (cval !== null) {
            root.document.cookie = r;
        }
    },
    isBoolean: function (o) {
        return (Lib.type(o) === 'Boolean');
    },
    isFunction: function (o) {
        return (Lib.type(o) === 'Function');
    },
    isObject: function (o) {
        return (Lib.type(o) === 'Object');
    },
    isString: function (v) {
        return (typeof v === 'string' || v instanceof String);
    },
    isArray: function (obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
    }

};

// gen_key 只可以在 js 文件里调用,返回js文件名及调用行号。
Lib.gen_key = (function () {
    var e = new Error();
    if (!e.stack)
        try {
            // IE requires the Error to actually be throw or else the Error's 'stack'
            // property is undefined.
            throw e;
        } catch (e) {
            if (!e.stack) {
                log('Error: your browser do not support Error.stack!');
                throw new Error('Error: your browser do not support Error.stack!');
                return 0; // IE < 10, likely
            }
        }
    var stack = e.stack.toString().split(/\r\n|\n/),
            frame,
            frameRE = /:(\d+):(?:(\d+))[^\d]*$/,
            scriptRE = /\/(\w+)\.js/;

    e = null;

    do {
        frame = stack.shift();
    } while (!frameRE.exec(frame) && stack.length);

    frame = (stack.shift());

    var m = frameRE.exec(frame);

    var line = m[1],
            char = m[2],
            script = scriptRE.exec(frame)[1];
    frameRE = null;
    scriptRE = null;
    m = null;

    var k = 'key_' + script + '_' + line + '_' + char;

    //var k='key_' + script + '_' + line ;
    //log(k);
    return k;
});/* global root, gvars, Lib */

// cardjs.card.f

var funcs = {
    trigger: function (key) {
        //log(this);
        if (!(key in this.cjsv.ev_handler)) {
            throw new Error('Error: Card.cjsv.ev_handler[' + key + '] not define!');
        }
        this.cjsv.ev_handler[key]();
    },
    on: function (event, id_key, ev_key) {

        // 绑定事件
        if (ev_key === undefined) {
            ev_key = id_key;
        }

        if (!(ev_key in this.cjsv.ev_handler)) {
            throw new Error('Error: Card.f.on: ev_handler[' + ev_key + '] not define!');
        }

        if (this.el(id_key, true).addEventListener) {
            this.el(id_key, true).addEventListener(event, this.cjsv.ev_handler[ev_key], false);
        } else {
            //ie
            this.el(id_key, true).attachEvent("on" + event, this.cjsv.ev_handler[ev_key]);
        }
        this.cjsv.evs.push([event, id_key, ev_key]);
    },
    off: function (event, id_key, ev_key) {
        // 解绑事件
        if (ev_key === undefined) {
            ev_key = id_key;
        }

        if (this.el(id_key, true).removeEventListener) {
            this.el(id_key, true).removeEventListener(event, this.cjsv.ev_handler[ev_key], false);
        } else {
            //ie
            this.el(id_key, true).detachEvent("on" + event, this.cjsv.ev_handler[ev_key]);
        }
    },
    merge: function (s) {
        for (var key in s) {
            this.settings[key] = s[key];
        }
    },
    clear_timer: function (num) {
        num = num || 0;
        if (num in this.cjsv.timer) {
            if (this.cjsv.timer[num]) {
                root.clearInterval(this.cjsv.timer[num]);
            }
            delete this.cjsv.timer[num];
        }
    },
    set_timer: function (call_back, interval, num) {
        num = num || 0;
        interval = interval || 3000;
        this.f.clear_timer(num);
        call_back.bind(this)();
        this.cjsv.timer[num] = root.setInterval(call_back, interval);
    },
    fetch: function () {

        /* 
         * fetch( op,param,func_ok,func_fail,verbose)
         * 
         * 这些参数的位置可变
         * 
         * 第一个出现的函数为 func_ok(json_object) 操作成功时的回调函数。
         * 第二个出再的函数为 func_fail(string) 操作失败时的回调函数。
         * 
         * 非函数参数以下简称参数：
         * 第一个出现的参数必须为字符串，内容为 serv.php 中相应的函数名。
         * 第二个出现的参数为调用 serv.php 的函数的参数。
         * 如果最后一个参数是 Boolean 型，则作为是否显示调试信息开关：verbose。
         * 
         * 注意！如果只有两个参数，且最后一个为 Boolean 则此参数解释为调试信息开关。
         *                    
         */



        var i, params = [], func = [];

        for (i = 0; i < arguments.length; i++) {
            switch (Lib.type(arguments[i])) {
                case 'Function':
                    func.push(arguments[i]);
                    break;
                default:
                    params.push(arguments[i]);
                    break;
            }
        }
        //log('param',params,'func',func);
        //log('fetch arguments:',arguments,'params:',params,'func:',func);


        if (params.length < 1 || Lib.type(params[0]) !== 'String') {
            throw new Error('error: cardjs.CARD.fetch()', 'parameters not match!');
        }

        var op, param = null, verbose = false;
        op = params[0];
        if (params.length > 1) {
            if (Lib.isString(params[1])) {
                param = params[1];
            } else {
                if (Lib.type(params[1]) === "Boolean" && params.length === 2) {
                    param = null;
                } else {
                    param = root.JSON.stringify(params[1]);
                }
            }
        }

        if (params.length > 1) {
            if (Lib.type(params[params.length - 1]) === "Boolean") {
                verbose = params[params.length - 1];
            }
        }
        params = null;

        if (func.length === 0) {
            func.push(function (r) {
                var flag = verbose;
                if (flag) {
                    log('Fetch:func_ok not set! \n Server response:');
                }
                log(r);
            });
        }
        if (func.length === 1) {
            func.push(function (r) {
                var flag = verbose;
                if (flag) {
                    log('Fetch:func_fail not set! \n Server response:');
                }
                log(r);
            });
        }

        var xhr = new root.XMLHttpRequest();
        xhr.open('POST', this.settings.server_page);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        //log('fetch.this:',this);
        xhr.onload = function () {
            //log('fetch.onload.this:',this);
            if (xhr.status !== 200) {
                log('Fetch: Error code ' + xhr.status);
                return;
            }
            if (!(this.self)) {
                log('Fetch error: Object has been destroyed!');
                return;
            }
            var raw_rsp = xhr.responseText;
            if (verbose) {
                log('Fetch.raw:\n' + raw_rsp);
            }
            var rsp = root.JSON.parse(raw_rsp);
            if (rsp && rsp.tk) {
                //log('update token, rsp:',rsp);
                gvars.token = rsp.tk;
                Lib.cookie_set('tk', gvars.token);
            }
            if (rsp && rsp.status && rsp.data) {
                //function ok
                func[0].bind(this)(rsp.data);
            } else {
                // function fial
                func[1].bind(this)(rsp.msg);
            }
            func = null;
        }.bind(this);

        if (gvars.token === null) {
            gvars.token = Lib.cookie_get('tk');
        }
        //log('op/data/tk',op,param,token);
        xhr.send(encodeURI('tk=' + gvars.token + '&op=' + op + '&data=' + param));
    }
};/* global root, Lib */

var Cache = (function () {
    var d = {};  // 缓存数据
    var e = {};  // 清除缓存的神奇字符串
    var f = {};  // event的神奇字符串和对应函数
    var r={
        event: function (ev, func, status) {
            /**
             * 如果 status=false 则 delete e[ev][this.settings.key]
             * 如果 func 是函数，添加到 f[ev].push({obj:this, func: func})
             * 如果 func 是 false ，则清理 f[ev][this,*]
             * @param {string} ev 事件名
             * @param {function} func 监听函数
             * @param {boolean} status 选项
             * @returns {boolean} 操作成功/失败(通常用不上)
             */

            var i, flag;

            f[ev] = f[ev] || [];
            if (Lib.isFunction(func)) {
                if (status === false) {
                    //delete func
                    flag = false;
                    //log('before delete:', f);
                    for (i = f[ev].length - 1; i >= 0; i--) {
                        if (f[ev][i].obj === this && f[ev][i].func === func) {
                            //log('match:', i);
                            f[ev].splice(i, 1);
                            flag = true;
                        }
                    }
                    //log('after delete func:', f);
                    return flag;
                }

                for (i = 0; i < f[ev].length; i++) {
                    if (f[ev][i].obj === this && f[ev][i].func === func) {
                        log('Function has already registed!', f);
                        return false;
                    }
                }

                this.cjsv.cevs[ev] = true; // 记录下事件名,在destroy时自动清理.
                f[ev].push({obj: this, func: func});
                //log('after regist new function:', f);
                return true;
            }

            if (func === false) {
                //delete ev listener
                flag = false;
                //log('before delete:', f);
                for (i = f[ev].length - 1; i >= 0; i--) {
                    if (f[ev][i].obj === this) {
                        //log('match:', i);
                        f[ev].splice(i, 1);
                        flag = true;
                    }
                }
                //log('after delete ev:', f);
                return flag;
            }

            // trigger event
            flag = true;
            var el;
            for (i = f[ev].length - 1; i >= 0; i--) {
                el = f[ev][i];
                if (el.obj && el.obj.self) {
                    //log('call func:',el);
                    el.func.bind(el.obj)(func);
                } else {
                    f[ev].splice(i, 1);
                    log('Error: object not exist， event listener deleted.');
                    flag = false;
                }
            }
            el = null;
            return flag;
        },
        cc_debug: function () {
            log('d:', d, ' e:', e);
        },
        clear_cache: function (ev, status) {
            /**
             * 如果 status=undefined 触发ev定义的事件
             * 如果 status=true 添加 e[ev][this.settings.key]=true
             * 如果 status=false 则 delete e[ev][this.settings.key]
             * @param {string} ev 事件名
             * @param {boolean} status 选项
             * @returns {boolean} 操作成功/失败(通常用不上)
             */

            e[ev] = e[ev] || {};

            // delete event[key]
            if (status === false) {
                if ((ev in e) && (this.settings.key in e[ev])) {
                    delete e[ev][this.settings.key];
                    return true;
                }
                return false;
            }
            // add event[key]
            if (status === true) {
                //log('call: clear_cache(ev,key)', ev, key);
                //log(e[ev]);
                e[ev][this.settings.key] = true;
                //log('after add key:', e);
                return true;
            }
            //trigger event
            if (status === undefined) {
                if (ev in e) {
                    //log('call: clear_cache(ev)', ev);
                    for (var k in e[ev]) {
                        if (k in d) {
                            d[k] = null;
                        }
                    }
                    //log('after delete cache:\n', ' d:', d, '\ne:', e);
                    return true;
                }
            }
            throw new Error('Error: CardJS.Card.f.cc_cache(ev,status) ev:string status:true/false/undefined');
            return false;
        },
        cache: function (data, key) {
            //log('db:',this);
            if (key === undefined) {
                key = this.settings.key;
            }
            if (!Lib.isString(key)) {
                throw new Error('CardJS.Cache.save(data,key) key must be string.');
            }
            d[key] = data;
            key = null;
        },
        restore: function (key) {

            if (key !== undefined && (key in d)) {
                return (d[key]);
            }

            if (this.settings.key in d) {
                return (d[this.settings.key]);
            }

            return null;
        }
    };
    return (r);
}());/* global gvars, Lib, funcs, Cache, call_method */

var Package = function (params) {

    this.self = true; // 兼容destroy()

    this.settings = {
        key: 'pkgshare'
    };

    Lib.expand(this.settings, gvars.settings, params.settings);

    this.cjsv = {
        // 登记 this.f.event()的时候记录下事件名.close的时候销毁事件.
        cevs: {}
    };

    this.f = {
        fetch: funcs.fetch.bind(this)
    };

    for (var k in Cache) {
        this.f[k] = Cache[k].bind(this);
    }

    bind_params(this, params, ['type']);
};

Package.prototype.destroy = function () {
    call_method.bind(this)('clean_up');
    var key;
    for (key in this.cjsv.cevs) {
        this.f.event(key, false);
        delete this.cjsv.cevs[key];
    }
    for (key in this.f) {
        this.f[key] = null;
        delete this.f[key];
    }
    for (key in this) {
        this[key] = null;
    }
    this.self = false;
};/* global root, gvars, Cache, Lib, call_method, release_event, funcs, bind_params */

// card对象

var Card = function (params) {
    
    this.construct(params);
    this.init(params);
    
};

/**
 * 每个派生对象都需要重写此方法
 * 里面是该对象特有的初始化代码
 */
Card.prototype.init=function(params){
    bind_params(this, params);
};

Card.prototype.construct = function (params) {

    var container_id = params.cid;

    this.self = root.document.getElementById(container_id);

    this.settings = {
        // 服务页面url
        server_page: 'serv.php',
        key: 'share',
        // 自动生成的id以什么开头（方便调试）
        header: 'card',
        // 这个卡片是否需要绑定事件
        add_event: false,
        // 显示debug信息 
        verbose: false
    };

    /* 
     * CARD内部使用的变量，设个奇怪的名包装起来不用占太多变量名。
     * fyi. cjsv = cardjs_variables
     */
    this.cjsv = {
        timer: {},
        evs: [], // this.f.on 绑定的事件
        ev_handler: {}, // 事件响应函数
        cevs: {}, // this.f.event 登记的事件
        ids: {},
        objs: {}, // cache
        cid: container_id,
        rendered: false,
        event_flag: false
    };



    Lib.expand(this.settings, gvars.settings, params.settings);

    this.f = {};

    var key;
    
    for (key in funcs) {
        this.f[key] = funcs[key].bind(this);
    }

    for (key in Cache) {
        this.f[key] = Cache[key].bind(this);
    }

    key = null;
};

/**
 * 如果 key = undefine 返回当前id数量.
 * 如果 obj = undefine 返回string类型的id.
 * 如果 obj = true 返回 key 对应的 DOM object.
 * 
 * @param {null/num/string} key 
 * @param {boolean} obj
 * @returns {num/string/DOM object}
 */
Card.prototype.el = function (key, obj) {
    // Card.el() return current elements number;
    if (key === undefined) {
        return Object.keys(this.cjsv.ids).length;
    }
    // Card.el('name') return { id: header_name_GlobalCounter_randstr, obj: documnet.getElementById(id)};
    if (obj === undefined) {
        var id;
        if (!(key in this.cjsv.ids)) {
            id = this.settings.header + '_' + key + '_' + (gvars.cur_serial_id++) + '_' + Lib.rand(8);
            this.cjsv.ids[key] = id;
        } else {
            id = this.cjsv.ids[key];
        }
        return id;
    }

    var dom = null;

    if (key in this.cjsv.objs) {
        dom = this.cjsv.objs[key];
    } else if (key in this.cjsv.ids) {
        dom = root.document.getElementById(this.cjsv.ids[key]);
        // cache
        if (dom !== null) {
            this.cjsv.objs[key] = dom;
        }
    }

    return dom;
};

Card.prototype.show = function () {
    if (!this.cjsv.rendered) {
        return this.refresh();
    }
    return this;
};

Card.prototype.refresh = function () {
    //render.bind(this)();
    if (this.cjsv.event_flag) {
        call_method.bind(this)('remove_event', true);
        release_event.bind(this)();
        this.cjsv.event_flag = false;
    }

    for (var key in this.cjsv.ids) {
        if (this.cjsv.objs[key]) {
            this.cjsv.objs[key] = null;
            delete this.cjsv.objs[key];
        }
        delete this.cjsv.ids[key];
    }

    call_method.bind(this)('data_parser');
    this.self.innerHTML = this.gen_html();
    call_method.bind(this)('before_add_event');
    if (this.el() > 0 && this.settings.add_event) {
        var evh = call_method.bind(this)('gen_ev_handler', true);

        if (!(Lib.isArray(evh) || Lib.isObject(evh))) {
            throw new Error('Card.cjsv.ev_handler should be [func1(), ... ] or { name1:func1(), ... }');
        }

        for (var key in evh) {
            this.cjsv.ev_handler[key] = evh[key].bind(this);
        }

        evh = null;

        if (!this.cjsv.event_flag) {
            call_method.bind(this)('add_event', true);
            this.cjsv.event_flag = true;
        }
    }
    call_method.bind(this)('after_add_event');

    this.cjsv.rendered = true;
    return this;
};


/* 
 * 销毁时进行一些清理工作。
 * 如果还有些其他要清理的东西可以写个
 * card.clean_up=function(){
 *   ... 你想清理的东西 ...
 * };
 */
Card.prototype.destroy = function () {

    if (this.cjsv.event_flag) {
        call_method.bind(this)('remove_event', true);
        release_event.bind(this)();
        this.cjsv.event_flag = false;
    }

    for (var key in this.cjsv.cevs) {
        this.f.event(key, false);
        delete this.cjsv.cevs[key];
    }

    call_method.bind(this)('clean_up');
    //this.cjsv.timer={};
    for (var key in this.cjsv.ids) {
        if (this.cjsv.objs[key]) {
            //this.cjsv.objs[key] = null;
            delete this.cjsv.objs[key];
        }
        delete this.cjsv.ids[key];
    }

    for (var key in this.f) {
        delete this.f[key];
    }
    for (var key in this) {
        this[key] = null;
    }
};

// 我真的不知道为什么我喜欢给他设个根本用不上的名字 ...
Card.prototype.name = 'CARD';

Card.prototype.gen_html = function () {
    throw new Error('Card.prototype.gen_html(): Please rewrite this function.');
    return '';
};


/* global Lib, Card, root */

//var Page = function (cid, cards, style) {
var Page = function (params) {
    // style={'cards':css_name,'card':css_name};
    var cid = params['cid'],
            cards = params.cards;

    if (!(Lib.isString(cid) && Lib.isArray(cards))) {
        // log('cid:', cid, ' cards:', cards);
        throw new Error('Error: new Page(cid,[ card1, card2, ...] )');
    }
    Card.call(this, params);

};

inherit(Page, Card);

Page.prototype.init = function (params) {
    this.style = params.style || null;
    this.cards = params.cards;
    this.settings.header = 'page';
    this.children = [];
    bind_params(this, params, ['style', 'cards']);
};

Page.prototype.name = 'PAGE';

Page.prototype.clean_up = function () {
    for (var key in this.children) {
        //log('page destroy:',this.children[key]);
        this.children[key] && this.children[key].destroy();
    }
    this.children = [];
};

Page.prototype.gen_html = function () {
    var html = '';

    for (var i = 0; i < this.cards.length; i++) {
        html += '<div id="' + this.el(i) + '" ';
        if (this.style && this.style['card']) {
            html += ' class="' + this.style['card'] + '" ';
        }
        html += '></div>';
    }
    return html;
};

Page.prototype.after_add_event = function () {
    this.clean_up();
    //log('page.this', this);

    function get_obj_from_string(str) {
        var obj = root;
        var s = str.split('.');
        for (var i = 0; i < s.length && obj !== undefined; i++) {
            obj = obj[s[i]];
        }
        return obj;
    }

    for (var i = 0; i < this.cards.length; i++) {
        var c = get_obj_from_string(this.cards[i]);
        var o = c(this.el(i));
        // log('str', this.cards[i], ' c', c, ' o', o);
        this.children.push(o.show());
    }
};
/* global Card, Lib */

var Panel = function (params) {
    //log('pages.type:', Lib.type(pages));
    var cid = params.cid,
            pages = params.pages,
            style = params.style;

    if (!(Lib.isString(cid) && Lib.type(pages) === 'Object')) {
        log('cid:', cid, ' pages:', pages, ' style:', style);
        throw new Error('Error: new Panel(cid,{name1:[card1, card2, ...],name2:[card, ...], ... )');
    }

    Card.call(this, params);



};

inherit(Panel, Card);

Panel.prototype.init = function (params) {
    var pages = params.pages;
    // style={'tags':css,'tag_active':css,'tag_normal':css,'page':css,'card':css};
    this.style = params.style || null;
    this.tags = Object.keys(pages);
    this.pages = pages;
    this.child = null;
    this.settings.header = 'panel';
    this.settings.add_event = true;
    bind_params(this, params, ['style', 'pages']);
};

// I really don't know why I like to set a name.
Panel.prototype.name = 'PANEL';

Panel.prototype.clean_up = function () {
    this.child && this.child.destroy();
    this.child = null;
};

Panel.prototype.gen_html = function () {
    var html = '<div ';
    if (this.style && this.style['tags']) {
        html += ' class="' + this.style['tags'] + '"';
    }
    html += '>';
    for (var i = 0; i < this.tags.length; i++) {
        html += '<input type="button" id="' + this.el(i) + '" value="' + this.tags[i] + '" >';
    }
    html += '</div><div id="' + this.el(i) + '" ';
    if (this.style && this.style['page']) {
        html += ' class="' + this.style['page'] + '"';
    }
    html += '></div>';
    return html;
};

Panel.prototype.gen_ev_handler = function () {
    var evs = [];
    //log('gen_ev_handler.this:',this);
    for (var i = 0; i < this.tags.length; i++) {
        (function () {
            var id = i;
            evs.push(function () {
                //log('panel_switch:',this);
                this.clean_up();
                if (this.style && this.style['tag_active'] && this.style['tag_normal']) {
                    for (var j = 0; j < this.tags.length; j++) {
                        //pn.objs[i].setAttribute('class',
                        this.el(j, true).setAttribute('class', this.style['tag_normal']);
                    }
                    this.el(id, true).setAttribute('class', this.style['tag_active']);
                }
                var page;
                var p = {
                    cid: this.el(this.tags.length),
                    cards: this.pages[this.tags[id]]
                };
                if (this.style && this.style['card']) {
                    p['style'] = {'card': this.style['card']};
                }
                page = new Page(p);
                this.child = page.show();
                page = null;
            });
        }());
    }
    //log('panel.gen_ev_handler:',evs);
    return evs;
};

Panel.prototype.add_event = function () {
    for (var i = 0; i < this.tags.length; i++) {
        this.f.on('click', i);
    }
};

Panel.prototype.after_add_event = function () {
    this.f.trigger(0);
};
/* global Lib */

function Create(params) {

    if (!Lib.isObject(params)) {
        throw new Error('CardJS.Create({type:\'Card/Page/Panel\', settings:{header:\'card\', gen_html:function(){}, ...} });');
    }

    if (!('cid' in params) && (params.type !== 'package')) {
        var f = function (container_id) {
            params['cid'] = container_id;
            return Create(params);
        };
        return f;
    }

    var o = null;

    switch (params['type']) {
        case('package'):
            o = new Package(params);
            break;
        case('page'):
            o = new Page(params);
            break;
        case('panel'):
            o = new Panel(params);
            break;
        default:
            o = new Card(params);
    }

    return o;
}

/* global Card, Set, Create, Lib */

var exports = {
    card: function(cid){
        var o=new Card({cid:cid})
        return o;
    },
    lib: Lib,
    set: Set,
    create: Create
};
    return (exports);
});