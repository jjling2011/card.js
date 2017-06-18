// https://github.com/jjling2011/card.js
// GPL-3.0

/* global define */


"use strict";

/*
 (function (name, context, definition) {
 // copy from https://github.com/ded/qwery/blob/master/src/qwery.js
 if (typeof module !== 'undefined' && module.exports) {
 module.exports = definition(context);
 } else if (typeof define === 'function' && define.amd) {
 define(function () {
 return definition(context);
 });
 } else {
 context[name] = definition(context);
 }
 })('cardjs', this, */
(function (root, module_name) {

    var Card = function (container_id) {

        var key;

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

        for (key in gset) {
            this.settings[key] = gset[key];
        }

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
            //wrapid: gen_id('card_wrap', 0, 16),
            //wrap: null,
            rendered: false,
            event_flag: false
        };

        this.f = {};

        for (key in funcs) {
            this.f[key] = funcs[key].bind(this);
        }

        for (key in Database) {
            this.f[key] = Database[key].bind(this);
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
                this.cjsv.ids[key] = id = gen_id(this.settings.header, key);
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
        render.bind(this)();
        this.cjsv.rendered = true;
        return this;
    };

    // 关键方法，生成、绑定、解绑事件，生成、显示界面，数据处理。
    function render() {
        if (this.cjsv.event_flag) {
            for (var key in this.cjsv.timer) {
                this.f.clear_timer(key);
            }

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
        return this;
    }
    ;
    /* 
     * 销毁时进行一些清理工作。
     * 如果还有些其他要清理的东西可以写个
     * card.clean_up=function(){
     *   ... 你想清理的东西 ...
     * };
     */
    Card.prototype.destroy = function () {

        for (var key in this.cjsv.timer) {
            this.f.clear_timer(key);
        }

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

    var gen_id = (function () {
        var id_counter = 0;
        return (
                function (header, key, len) {
                    len = len || 8;
                    return  header + '_' + key + '_' + (id_counter++) + '_' + Lib.rand(len);
                });
    }());



    // 我真的不知道为什么我喜欢给他设个根本用不上的名字 ...
    Card.prototype.name = 'CARD';
    Card.prototype.gen_html = function () {
        throw new Error('Card.prototype.gen_html(): Please rewrite this function.');
        return '';
    };

    // 自动释放通过 card.f.on 绑定的事件。后面的 remove_event 是手动。
    function release_event() {
        var key;
        if (this.cjsv.evs.length > 0) {
            //console.log('before release_event:', this.cjsv.evs);
            var e = this.cjsv.evs;
            for (key in e) {
                e[key] && this.f.off(e[key][0], e[key][1], e[key][2]);
                delete e[key];
            }
            //console.log('after release_event:', this.cjsv.evs);
            e = null;

        }
        this.cjsv.evs = [];
        for (key in this.cjsv.ev_handler) {
            delete this.cjsv.ev_handler[key];
        }
        key = null;
    }

    // 如果card中有就调用，没有就显示一行debug信息。
    function call_method(fn, warn) {
        //console.log(this,fn,warn);
        if (fn in this) {
            return(this[fn]());
        }
        if (warn && this.settings.verbose) {
            console.log('Call undefine method: Card.prototype.funcs.' + fn + '()');
        }
        return false;
    }

    var Page = function (cid, cards, style) {
        // style={'cards':css_name,'card':css_name};
        if (!(Lib.isString(cid) && Lib.isArray(cards))) {
            console.log('cid:', cid, ' cards:', cards);
            throw new Error('Error: new Page(cid,[ card1, card2, ...] )');
        }

        Card.call(this, cid);
        this.style = style || null;
        this.cards = cards;
        this.settings.header = 'page';
        this.children = [];
    };

    inherit(Page, Card);

    Page.prototype.name = 'PAGE';

    Page.prototype.clean_up = function () {
        for (var key in this.children) {
            //console.log('page destroy:',this.children[key]);
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
        for (var i = 0; i < this.cards.length; i++) {
            this.children.push(this.cards[i](this.el(i)).show());
        }
    };

    var Panel = function (cid, pages, style) {
        //console.log('pages.type:', Lib.type(pages));
        if (!(Lib.isString(cid) && Lib.type(pages) === 'Object')) {
            console.log('cid:', cid, ' pages:', pages, ' style:', style);
            throw new Error('Error: new Panel(cid,{name1:[card1, card2, ...],name2:[card, ...], ... )');
        }
        Card.call(this, cid);
        // style={'tags':css,'tag_active':css,'tag_normal':css,'page':css,'card':css};
        this.style = style || null;
        this.tags = Object.keys(pages);
        this.pages = pages;
        this.child = null;
        this.settings.header = 'panel';
        this.settings.add_event = true;
    };

    inherit(Panel, Card);

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
        //console.log('gen_ev_handler.this:',this);
        for (var i = 0; i < this.tags.length; i++) {
            (function () {
                var id = i;
                evs.push(function () {
                    //console.log('panel_switch:',this);
                    this.clean_up();
                    if (this.style && this.style['tag_active'] && this.style['tag_normal']) {
                        for (var j = 0; j < this.tags.length; j++) {
                            //pn.objs[i].setAttribute('class',
                            this.el(j, true).setAttribute('class', this.style['tag_normal']);
                        }
                        this.el(id, true).setAttribute('class', this.style['tag_active']);
                    }
                    var page;
                    if (this.style && this.style['card']) {
                        page = new Page(this.el(this.tags.length), this.pages[this.tags[id]], {'card': this.style['card']});
                    } else {
                        page = new Page(this.el(this.tags.length), this.pages[this.tags[id]]);
                    }
                    this.child = page.show();
                    page = null;
                });
            }());
        }
        //console.log('panel.gen_ev_handler:',evs);
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

    var funcs = {
        trigger: function (key) {
            //console.log(this);
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
            //console.log('param',params,'func',func);
            //console.log('fetch arguments:',arguments,'params:',params,'func:',func);


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
                        console.log('Fetch:func_ok not set! \n Server response:');
                    }
                    console.log(r);
                });
            }
            if (func.length === 1) {
                func.push(function (r) {
                    var flag = verbose;
                    if (flag) {
                        console.log('Fetch:func_fail not set! \n Server response:');
                    }
                    console.log(r);
                });
            }

            var xhr = new root.XMLHttpRequest();
            xhr.open('POST', this.settings.server_page);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            //console.log('fetch.this:',this);
            xhr.onload = function () {
                //console.log('fetch.onload.this:',this);
                if (xhr.status !== 200) {
                    console.log('Fetch: Error code ' + xhr.status);
                    return;
                }
                if (!(this.self)) {
                    console.log('Fetch error: Object has been destroyed!');
                    return;
                }
                var raw_rsp = xhr.responseText;
                if (verbose) {
                    console.log('Fetch.raw:\n' + raw_rsp);
                }
                var rsp = root.JSON.parse(raw_rsp);
                if (rsp && rsp.tk) {
                    //console.log('update token:',rsp.tk);
                    Lib.cookie_set('tk', rsp.tk);
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
            var cookie = Lib.cookie_get('tk');
            //console.log('fetch read local cookie:',cookie);
            xhr.send(encodeURI('op=' + op + '&data=' + param + '&tk=' + cookie));
            cookie = null;
        }
    };

    var Set = function (params) {
        if (!(Lib.type(params) === 'Object')) {
            throw new Error('Error: CardJS.Lib.set( {key1:value1,key2:value2, ... });');
        }
        for (var key in params) {
            gset[key] = params[key];
        }
    };

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
        utf8_to_base64: function (text_utf8) {
            //对应 php decode:
            // $txt_utf8 = urldecode(base64_decode($txt_b64));
            return root.btoa(root.encodeURIComponent(text_utf8));
        },
        base64_to_utf8: function (text_base64) {
            // 对应 php encode: 
            // $txt_b64 =base64_encode(rawurlencode($txt_utf8));
            // **** 注意是带raw三个字母 **** 
            // 不要问为什么！记住php是世界上最好的语言就对了！！
            return (root.decodeURIComponent(root.atob(text_base64)));
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
            left = rect.left + root.scrollX + rect.width;
            top = rect.top + root.scrollY + rect.height;
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
            //console.log('url_set_param:',page,params);
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
            var myd, y, m, d;
            if (date_str) {
                myd = new Date(date_str);
            } else {
                myd = new Date();
            }
            y = myd.getFullYear();
            m = ('0' + (myd.getMonth() + 1)).slice(-2);
            d = ('0' + myd.getDate()).slice(-2);
            myd = null;
            return ([y, m, d].join('-'));
        },
        getTime: function (d) {
            var mydate = new Date(d), str;
            str = ('0' + mydate.getHours()).slice(-2) + ':'
                    + ('0' + mydate.getMinutes()).slice(-2);
            mydate = null;
            return (str);
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
                    console.log('Error: your browser do not support Error.stack!');
                    throw new Error('Error: your browser do not support Error.stack!');
                    return 0; // IE < 10, likely
                }
            }
        var stack = e.stack.toString().split(/\r\n|\n/),
                frame,
                frameRE = /:(\d+):(?:\d+)[^\d]*$/,
                scriptRE = /\/(\w+)\.js/;

        e = null;

        do {
            frame = stack.shift();
        } while (!frameRE.exec(frame) && stack.length);

        frame = (stack.shift());

        var line = frameRE.exec(frame)[1],
                script = scriptRE.exec(frame)[1];
        frameRE = null;
        scriptRE = null;
        //console.log(script);
        return 'key_' + script + '_js_' + line;
    });

    var gset = {};

    var console = root.console || {log: function () {}};

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

    function Create(params) {

        if (!Lib.isObject(params)) {
            throw new Error('CardJS.Create({type:\'Card/Page/Panel\', settings:{header:\'card\', gen_html:function(){}, ...} });');
        }

        if (!('cid' in params)) {
            throw new Error('CardJS.Create(params): params must have key cid');
        }
        var o = null;
        var style = undefined;
        var cid = params['cid'];

        switch (params['type']) {
            case('page'):
                if (!('cards' in params)) {
                    throw new Error('CardJS.Create(): page must contain cards.');
                }
                if ('style' in params) {
                    style = params['style'];
                }
                o = new Page(cid, params['cards'], style);
                break;
            case('panel'):
                if (!('pages' in params)) {
                    throw new Error('CardJS.Create(): page must contain pages.');
                }
                if ('style' in params) {
                    style = params['style'];
                }
                o = new Panel(cid, params['pages'], style);
                break;
            default:
                o = new Card(cid);
                break;
        }

        if ('settings' in params) {
            Lib.expand(o.settings, params['settings']);
        }

        var skip = {'cards': null, 'type': null, 'settings': null, 'pages': null, 'style': null};

        for (var key in params) {
            if (!(key in skip)) {
                if (Lib.isFunction(params[key])) {
                    o[key] = params[key].bind(o);
                } else {
                    o[key] = params[key];
                }
            }
        }

        cid = null;
        style = null;
        skip = null;
        params = null;


        return o;
    }

    var Database = (function () {
        var d = {};
        var e = {};
        var f = {};
        return ({
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
                        root.console.log('before delete:', f);
                        for (i = f[ev].length - 1; i >= 0; i--) {
                            if (f[ev][i].obj === this && f[ev][i].func === func) {
                                //console.log('match:', i);
                                f[ev].splice(i, 1);
                                flag = true;
                            }
                        }
                        root.console.log('after delete func:', f);
                        return flag;
                    }

                    for (i = 0; i < f[ev].length; i++) {
                        if (f[ev][i].obj === this && f[ev][i].func === func) {
                            root.console.log('Function has already registed!', f);
                            return false;
                        }
                    }

                    this.cjsv.cevs[ev] = true; // 记录下事件名,在destroy时自动清理.
                    f[ev].push({obj: this, func: func});
                    //root.console.log('after regist new function:', f);
                    return true;
                }

                if (func === false) {
                    //delete ev listener
                    flag = false;
                    //root.console.log('before delete:', f);
                    for (i = f[ev].length - 1; i >= 0; i--) {
                        if (f[ev][i].obj === this) {
                            //console.log('match:', i);
                            f[ev].splice(i, 1);
                            flag = true;
                        }
                    }
                    //root.console.log('after delete ev:', f);
                    return flag;
                }

                // trigger event
                flag = true;
                var el;
                for (i = f[ev].length - 1; i >= 0; i--) {
                    el = f[ev][i];
                    if (el.obj && el.obj.self) {
                        //root.console.log('call func:',el);
                        el.func.bind(el.obj)(func);
                    } else {
                        f[ev].splice(i, 1);
                        console.log('Error: object not exist， event listener deleted.');
                        flag = false;
                    }
                }
                el = null;
                return flag;
            },
            cc_debug: function () {
                root.console.log('d:', d, ' e:', e);
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
                    //console.log('call: clear_cache(ev,key)', ev, key);
                    //console.log(e[ev]);
                    e[ev][this.settings.key] = true;
                    //root.console.log('after add key:', e);
                    return true;
                }
                //trigger event
                if (status === undefined) {
                    if (ev in e) {
                        //console.log('call: clear_cache(ev)', ev);
                        for (var k in e[ev]) {
                            if (k in d) {
                                d[k] = null;
                            }
                        }
                        //console.log('after delete cache:\n', ' d:', d, '\ne:', e);
                        return true;
                    }
                }
                throw new Error('Error: CardJS.Card.f.cc_cache(ev,status) ev:string status:true/false/undefined');
                return false;
            },
            cache: function (data, key) {
                //console.log('db:',this);
                if (key === undefined) {
                    key = this.settings.key;
                }
                if (!Lib.isString(key)) {
                    throw new Error('CardJS.Database.save(data,key) key must be string.');
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
        });
    }());

    var exports = {
        card: Card,
        //page: Page,
        //panel: Panel,
        //db: Database,
        lib: Lib,
        set: Set,
        create: Create
    };

    root[module_name] = exports;

    //return (exports);
}(window, 'cardjs'));
// );