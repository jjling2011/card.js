/* global root */

var Lib = {
    expand: function () {
        if (arguments.length < 1) {
            throw new Error('Error: Lib.expand(obj1, obj2, ... )');
        }
        var o = arguments[0];
        if (!(Lib.isObject(arguments[0]) || Lib.isArray(arguments[0]))) {
            throw new Error('Error: Lib.expand() first param should be {} or []');
        }
        for (var i = 1; i < arguments.length; i++) {
            for (var key in arguments[i]) {
                o[key] = arguments[i][key];
            }
        }
        o = null;
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
});