// https://github.com/jjling2011/card.js
// GPL-3.0

/* global define */
/**/
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
})
        /**/
                ('cardjs', this, function (root) {

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
                            evs: [],
                            ids: {},
                            objs: {}, // cache
                            ev_handler: {},
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
                        //console.log('show:',this);
                        if (!this.cjsv.rendered) {
                            return this.refresh();
                        }
                        return this;
                        //this.cjsv.wrap.style.display = 'block';
                    };

//                    Card.prototype.disappear = function () {
//                        if (this.cjsv.wrap) {
//                            this.cjsv.wrap.style.display = 'none';
//                        }
//                    };

                    Card.prototype.refresh = function () {
                        //console.log('refresh',this);
                        render.bind(this)();
                        this.cjsv.rendered = true;
                        return this;
                        //this.cjsv.wrap = root.document.getElementById(this.cjsv.wrapid);
                    };

                    // 关键方法，生成、绑定、解绑事件，生成、显示界面，数据处理。
                    function render() {
                        var that = this;
                        //console.log('render',this);
                        if (this.cjsv.event_flag) {
                            for (var key in this.cjsv.timer) {
                                this.f.clear_timer(key);
                            }
                            // why netbeans consider 'this' is a global var if I replace 'that' with 'this' ?
                            that.cjsv.timer = {};
                            call_method.bind(this)('remove_event', true);
                            release_event.bind(this)();
                            this.cjsv.event_flag = false;
                        }

                        that.cjsv.ids = {};
                        that.cjsv.objs = {};

                        call_method.bind(this)('data_parser');
                        //this.self.innerHTML = '<div id="' + this.cjsv.wrapid + '" style="width:100%;display:block;">' + this.gen_html() + '</div>';
                        this.self.innerHTML = this.gen_html();
                        call_method.bind(this)('before_add_event');
                        if (this.el() > 0 && this.settings.add_event) {
                            var evh = call_method.bind(this)('gen_ev_handler', true);

                            if (!(Lib.isArray(evh) || Lib.isObject(evh))) {
                                throw new Error('Card.cjsv.ev_handler should be [func1(), ... ] or { name1:func1(), ... }');
                            }

                            that.cjsv.ev_handler = {};
                            for (var key in evh) {
                                this.cjsv.ev_handler[key] = evh[key].bind(this);
                            }

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
                        var that = this;
                        //console.log('card destroy:',this);
                        for (var key in this.cjsv.timer) {
                            this.f.clear_timer(key);
                        }
                        that.cjsv.timer = {};

                        //console.log('this:', this, ' that:', that);

                        if (this.cjsv.event_flag) {
                            call_method.bind(this)('remove_event', true);
                            release_event.bind(this)();
                            this.cjsv.event_flag = false;
                        }

                        call_method.bind(this)('clean_up');
                        //this.cjsv.timer={};
                        that.cjsv.ids = {};
                        that.cjsv.objs = {};
                        this.self = null;
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
                        console.log('Card.prototype.gen_html(): Please rewrite this function.');
                        return '';
                    };

                    // 自动释放通过 card.f.on 绑定的事件。后面的 remove_event 是手动。
                    function release_event() {
                        if (this.cjsv.evs.length > 0) {
                            //console.log('before release_event:', this.cjsv.evs);
                            var e = this.cjsv.evs;
                            for (var key in e) {
                                e[key] && this.f.off(e[key][0], e[key][1], e[key][2]);
                            }
                            //console.log('after release_event:', this.cjsv.evs);
                        }
                        this.cjsv.evs = [];
                        var that = this;
                        that.cjsv.ev_handler = {};
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
                            this.children[key].destroy();
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
                        //this.settings.id_num = this.tags.length + 1;
                        this.settings.header = 'panel';
                        this.settings.add_event = true;
                    };

                    inherit(Panel, Card);

                    // I really don't know why I like to set a name.
                    Panel.prototype.name = 'PANEL';

                    Panel.prototype.clean_up = function () {
                        //console.log('panel destory:',this.child);
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
                                });
                            }());
                        }
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
                            //console.log('this:',this);
                            //console.log('that:',that);
                            // 合并选项
                            //console.log('merge:',s);
                            for (var key in s) {
                                this.settings[key] = s[key];
                            }
                            //console.log('merge:',this);
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
                                if (rsp && rsp.status && rsp.data) {
                                    //function ok
                                    func[0].bind(this)(rsp.data);
                                } else {
                                    // function fial
                                    func[1].bind(this)(rsp.msg);
                                }
                            }.bind(this);
                            xhr.send(encodeURI('op=' + op + '&data=' + param));
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
                            el = el.getBoundingClientRect();
                            return {
                                left: el.left + root.scrollX + el.width,
                                top: el.top + root.scrollY + el.height
                            };
                        },
                        url_get_page: function () {
                            var url = root.document.location.href;
                            url = url.substring(0, (url.indexOf("#") === -1) ? url.length : url.indexOf("#"));
                            url = url.substring(0, (url.indexOf("?") === -1) ? url.length : url.indexOf("?"));
                            url = url.substring(url.lastIndexOf("/") + 1, url.length);
                            return url;
                        },
                        url_set_param: function (page, params) {
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
                            if (!results || !results[2]) {
                                return false;
                            }
                            return root.decodeURIComponent(results[2].replace(/\+/g, " "));
                        },
                        type: function (obj) {
                            return Object.prototype.toString.call(obj).slice(8, -1);
                        },
                        getYMD: function (date_str) {
                            var myd = null;
                            if (date_str) {
                                myd = new Date(date_str);
                            } else {
                                myd = new Date();
                            }
                            return ([
                                myd.getFullYear(),
                                ('0' + (myd.getMonth() + 1)).slice(-2),
                                ('0' + myd.getDate()).slice(-2)
                            ].join('-'));
                        },
                        getTime: function (d) {
                            var mydate = new Date(d);
                            return (('0' + mydate.getHours()).slice(-2) + ':' + ('0' + mydate.getMinutes()).slice(-2));
                        },
                        cookie_set: function (name, value, expires) {
                            //默认一年,expires默认一个月
                            expires = expires || 30 * 24 * 60 * 60;
                            expires = expires * 1000;
                            var exp = new Date();  //获得当前时间  
                            exp.setTime(exp.getTime() + expires);  //换成毫秒  
                            root.document.cookie = name + "=" + root.escape(value) + ";expires=" + exp.toGMTString();
                        },
                        cookie_get: function (name) {
                            var arr = root.document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
                            if (arr !== null) {
                                return root.unescape(arr[2]);
                            } else {
                                return "";
                            }
                        },
                        cookie_del: function (name) {
                            var exp = new Date();  //当前时间  
                            exp.setTime(exp.getTime() - 1);
                            var cval = getCookie(name);
                            if (cval !== null) {
                                root.document.cookie = name + "=" + cval + ";expires=" + exp.toGMTString();
                            }
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

                        return o;
                    }

                    var Database = (function () {
                        var d = {};
                        return ({
                            save: function (data, key) {
                                //console.log('db:',this);
                                key = key || this.settings.key;
                                if (!Lib.isString(key)) {
                                    throw new Error('CardJS.Database.save(data,key) key must be string.');
                                }
                                d[key] = data;
                            },
                            load: function (key) {
                                //console.log('db:',this);
                                key = key || this.settings.key;
                                if (key in d) {
                                    return (d[key]);
                                }
                                return null;
                            }
                        });
                    }());

                    return ({
                        card: Card,
                        //page: Page,
                        //panel: Panel,
                        //db: Database,
                        lib: Lib,
                        set: Set,
                        create: Create
                    });
                });