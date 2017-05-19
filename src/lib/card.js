/* 
 * https://github.com/jjling2011/card.js
 * LINCENSE: GPL v3 
 * jjling at gmail dot com 
 * 2016-11-09
 */

var cardjs = {
    cNew: function () {
        var cjs = {
            //存放通过cardjs生成的对象,在PAGE/PANEL之间相互调用。
            o: {}
        };

        //各通用小函数
        cjs.f = {
            pad: function (n, width, z) {
                z = z || '0';
                n = n + '';
                return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
            },
            clamp: function (val, min, max) {
                return Math.min(Math.max(val, min), max);
            },
            html_escape: function (unsafe) {
                return unsafe
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#039;");
            },
            rmA: function (a, e) {
                for (var i = a.length; i >= 0; --i) {
                    if (a[i] === e) {
                        a.splice(i, 1);
                    }
                }
            },
            cutA: function (a, len) {
                len = len || 25;
                while (a.length > len) {
                    a.pop();
                }
            },
            addA: function (a, el, len) {
                len = len || 25;
                cjs.f.rmA(a, el);
                a.unshift(el);
                cjs.f.cutA(a, len);
            },
            isString: function (v) {
                return (typeof v === 'string' || v instanceof String);
            },
            rand: function (len) {
                len = len || 32;
                var chars = 'abcdefghijklmnopqrstuvwxyz'
                        + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                        + '0123456789';
                var maxPos = chars.length;
                var rtv = '';
                for (var i = 0; i < len; i++) {
                    rtv += chars.charAt(Math.floor(Math.random() * maxPos));
                }
                return rtv;
            },
            YMD: function (date_str) {
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
            gen_ids: (function () {
                var id_counter = 0;
                return (
                        function (head, num, len) {
                            len = len || 8;
                            var rid = head + '_' + id_counter + '_' + cjs.f.rand(len) + '_';
                            id_counter++;
                            var rtv = new Array();
                            for (var i = 0; i < num; ++i) {
                                rtv.push(rid + i);
                            }

                            return rtv;
                        });
            }()),
            gen_objs: function (ids) {
                var rtv = new Array();
                for (var i = 0; i < ids.length; i++) {
                    rtv.push(document.getElementById(ids[i]));
                }
                return (rtv);
            },
            get_page_name: function () {
                var url = document.location.href;
                url = url.substring(0, (url.indexOf("#") === -1) ? url.length : url.indexOf("#"));
                url = url.substring(0, (url.indexOf("?") === -1) ? url.length : url.indexOf("?"));
                url = url.substring(url.lastIndexOf("/") + 1, url.length);
                return url;
            },
            get_url_param: function (name, url) {
                url = url || window.location.href;
                name = name.replace(/[\[\]]/g, "\\$&");
                var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                        results = regex.exec(url);
                if (!results || !results[2]) {
                    return '';
                }
                return decodeURIComponent(results[2].replace(/\+/g, " "));
            },
            str_to_time: function (d) {
                var mydate = new Date(d);
                return (('0' + mydate.getHours()).slice(-2) + ':' + ('0' + mydate.getMinutes()).slice(-2));
            },
            set_cookie: function (name, value, expires) {
                //默认一年,expires默认一个月
                expires = expires || 30 * 24 * 60 * 60;
                expires = expires * 1000;
                var exp = new Date();  //获得当前时间  
                exp.setTime(exp.getTime() + expires);  //换成毫秒  
                document.cookie = name + "=" + escape(value) + ";expires=" + exp.toGMTString();
            },
            get_cookie: function (name) {
                var arr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
                if (arr !== null) {
                    return unescape(arr[2]);
                } else {
                    return "";
                }
            },
            del_cookie: function (name) {
                var exp = new Date();  //当前时间  
                exp.setTime(exp.getTime() - 1);
                var cval = getCookie(name);
                if (cval !== null) {
                    document.cookie = name + "=" + cval + ";expires=" + exp.toGMTString();
                }
            },
            isArray: function (obj) {
                return Object.prototype.toString.call(obj) === "[object Array]";
            }
        };

        cjs.CARD = {
            cNew: function (container_id) {
                var card = {
                    self: document.getElementById(container_id),
                    // 各个设置项
                    settings: {
                        // 标识实例类型
                        name: 'CARD',
                        /* 
                         * 读取服务器数据会花点时间，如果n毫秒后还没读取到则提示刷新。 
                         * 默认0代表不显示提示信息。
                         */
                        loading_tip_delay: 0,
                        // 服务页面url
                        server_page: 'serv.php',
                        // 这个卡片有几个需要设置 id 的 html 元素
                        id_num: 0,
                        /* 
                         * 你希望生成的id以什么开头。
                         * 生成的id通常像这样： id头_16位随机数_0开始递增
                         */
                        id_header: 'id',
                        // 这个卡片是否需要绑定事件
                        add_event: false,
                        /*
                         * 调用refresh()时，向server_page发送什么参数
                         * 例如：fetch:['echo_str','hellooooooo']
                         * 详见 card.f.fetch()
                         */
                        fetch: false,
                        // 显示debug信息 
                        verbose: false
                    },
                    /* 
                     * CARD内部使用的变量，设个奇怪的名包装起来不用占太多变量名。
                     * fyi. cjsv = cardjs_variables
                     */
                    cjsv: {
                        timer: {},
                        evs: [],
                        container_id: container_id,
                        loading_tip_timer: null,
                        event_flag: false
                    }
                };

                // 各种小函数
                card.f = {
                    on: function (event, obj_index, handler_index) {
                        // 绑定事件
                        if (!handler_index && handler_index !== 0) {
                            handler_index = obj_index;
                        }
                        if (card.objs[obj_index].addEventListener) {
                            card.objs[obj_index].addEventListener(event, card.ev_handler[handler_index], false);
                        } else {
                            //ie
                            card.objs[obj_index].attachEvent("on" + event, card.ev_handler[handler_index]);
                        }
                        card.cjsv.evs[obj_index] = [event, handler_index];
                    },
                    off: function (event, obj_index, handler_index) {
                        // 解绑事件
                        if (!handler_index && handler_index !== 0) {
                            handler_index = obj_index;
                        }

                        if (card.objs[obj_index].removeEventListener) {
                            card.objs[obj_index].removeEventListener(event, card.ev_handler[handler_index], false);
                        } else {
                            //ie
                            card.objs[obj_index].detachEvent("on" + event, card.ev_handler[handler_index]);
                        }
                        if (card.cjsv.evs[obj_index]) {
                            delete card.cjsv.evs[obj_index];
                        }
                    },
                    merge: function (s) {
                        // 合并选项
                        for (var key in s) {
                            card.settings[key] = s[key];
                        }
                    },
                    clear_timer: function (num) {
                        num = num || 0;
                        if (num in card.cjsv.timer) {
                            if (card.cjsv.timer[num]) {
                                clearInterval(card.cjsv.timer[num]);
                            }
                            delete card.cjsv.timer[num];
                        }
                    },
                    set_timer: function (call_back, interval, num) {
                        num = num || 0;
                        interval = interval || 3000;
                        card.f.clear_timer(num);
                        call_back();
                        card.cjsv.timer[num] = setInterval(call_back, interval);
                    },
                    show_loading_tip: function () {
                        var self = card.self;
                        if (card.settings.loading_tip_delay > 0) {
                            if (card.cjsv.loading_tip_timer) {
                                clearTimeout(card.cjsv.loading_tip_timer);
                            }
                            card.cjsv.loading_tip_timer =
                                    setTimeout(function () {
                                        self.innerHTML = '加载中... 长时间无反应可以 ' +
                                                '<a href="#" onclick="window.location.reload(true);">刷新一下</a>';
                                    }.bind(self), card.settings.loading_tip_delay);
                        }
                    },
                    fetch: function (op, param, func_ok, verbose, func_fail) {
                        func_fail = func_fail || false;
                        if (!cjs.f.isString(param)) {
                            param = JSON.stringify(param);
                        }
                        var xhr = new XMLHttpRequest();
                        xhr.open('POST', card.settings.server_page);
                        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                        xhr.onload = function () {
                            if (xhr.status !== 200) {
                                console.log('Fetch: Error code ' + xhr.status);
                                return;
                            }
                            if (!(card.self)) {
                                console.log('Fetch error: Object has been destroyed!');
                                return;
                            }
                            var raw_rsp = xhr.responseText;
                            if (verbose) {
                                console.log('Fetch.raw:\n' + raw_rsp);
                            }
                            var rsp = JSON.parse(raw_rsp);
                            if (rsp && rsp.status && rsp.data) {
                                func_ok(rsp.data);
                            } else {
                                console.log('Fetch error: fetch data fail!');
                                console.log(rsp);
                                if (func_fail) {
                                    func_fail(rsp.msg);
                                }
                            }
                        };
                        xhr.send(encodeURI('op=' + op + '&data=' + param));
                    }
                };

                // 生成一个虚方法，创建CARD实例时必须重写这个方法。
                function gen_virtual_method(func_name) {
                    var fn = [].concat(func_name);
                    for (var i = 0; i < fn.length; i++) {
                        card[fn[i]] = function () {
                            if (card.settings.verbose) {
                                console.log('CARD.' + fn + '(): please rewrite this method!');
                            }
                            return false;
                        };
                    }
                }

                // 自动释放通过 card.f.on 绑定的事件。后面的 remove_event 是手动。
                function release_event() {
                    if (card.cjsv.evs.length > 0) {
                        for (var key in card.cjsv.evs) {
                            if (card.cjsv.evs[key]) {
                                card.f.off(card.cjsv.evs[key][0], key, card.cjsv.evs[key][1]);
                                delete card.cjsv.evs[key];
                            }
                        }
                        card.cjsv.evs = [];
                    }
                }

                // 如果card中有就调用，没有就显示一行debug信息。
                function call_method(fn, warn) {
                    if (fn in card) {
                        card[fn]();
                    } else {
                        if (warn && card.settings.verbose) {
                            console.log('Call undefine method: Card.' + fn + '()');
                        }
                    }
                }

                // 关键方法，生成、绑定、解绑事件，生成、显示界面，数据处理。
                card.show = function () {
                    if (card.cjsv.event_flag) {
                        call_method('remove_event', true);
                        release_event();
                        for (var key in card.cjsv.timer) {
                            card.f.clear_timer(key);
                        }
                        card.cjsv.timer = {};
                        card.cjsv.event_flag = false;

                    }
                    call_method('data_parser');
                    if (card.settings.id_num >= 1) {
                        card.ids = cjs.f.gen_ids(card.settings.id_header, card.settings.id_num);
                    }
                    card.self.innerHTML = card.gen_html();
                    if (card.settings.id_num >= 1) {
                        card.objs = cjs.f.gen_objs(card.ids);
                    }
                    call_method('before_add_event');
                    if (card.settings.id_num >= 1 && card.settings.add_event) {
                        call_method('gen_ev_handler', true);
                        if (!card.cjsv.event_flag) {
                            call_method('add_event', true);
                            card.cjsv.event_flag = true;
                        }
                    }
                    call_method('after_add_event');
                    return card;
                };

                // 生成创建界面代码的虚方法。
                gen_virtual_method('gen_html');

                /* 
                 * 销毁时进行一些清理工作。
                 * 如果还有些其他要清理的东西可以写个
                 * card.clean_up=function(){
                 *   ... 你想清理的东西 ...
                 * };
                 */
                card.destroy = function () {
                    if (card.cjsv.event_flag) {
                        call_method('remove_event', true);
                        release_event();
                        card.cjsv.event_flag = false;
                    }
                    for (var key in card.cjsv.timer) {
                        card.f.clear_timer(key);
                    }
                    card.cjsv.timer = {};
                    call_method('clean_up');
                    card.self = null;
                };

                // 从card.settings.server_page读取数据，然后调用got_data();
                card.refresh = function () {
                    card.f.show_loading_tip();
                    if (card.settings.fetch) {
                        card.f.fetch(card.settings.fetch[0],
                                card.settings.fetch[1],
                                card.got_data,
                                card.settings.verbose);
                    } else {
                        card.show();
                    }
                    return card;
                };

                /* 
                 * 将card.settings.server_page返回的数据存入card.data 然后调用 card.show()
                 * 如果需要对数据进行一些处理，可重写些方法。
                 */
                card.got_data = function (data) {
                    card.data = data;
                    if (card.cjsv.loading_tip_timer) {
                        clearTimeout(card.cjsv.loading_tip_timer);
                        card.cjsv.loading_tip_timer = null;
                    }
                    card.show();
                };

                return (card);
            }
        };

        cjs.PAGE = {
            /*
             * PAGE是将多个CARD整合在一起，大概长这样子：
             * <div class="page_style"> cjs.o.[cards[0]] <div>
             * <div class="page_style"> cjs.o.[cards[1]] <div>
             *    ...
             *    
             * 参数 cards 是一个 cjs.o 下对象名组成的数组。
             * 参数 page_style 是样式字符串。
             */

            cNew: function (container_id, cards, page_style) {

                var pg = cjs.CARD.cNew(container_id);

                pg.settings.id_header = 'page';
                pg.settings.style = page_style;
                pg.settings.name = 'PAGE';

                pg.cards = [];


                pg.data_parser = function () {
                    if (!cjs.f.isArray(cards) || cards.length <= 0) {
                        throw 'Error: PAGE(container_id,cards) cards should be an array!';
                    }
                    for (var i = 0; i < cards.length; i++) {
                        if (!(cards[i] in cjs.o)) {
                            throw 'Card ' + cards[i] + ' undefined!';
                        }
                    }
                    pg.data = cards;
                    pg.settings.id_num = pg.data.length;
                };

                pg.gen_html = function () {
                    var html = '';
                    for (var i = 0; i < pg.data.length; ++i) {
                        if (pg.settings.style) {
                            html += '<div id="' + pg.ids[i] + '" class="' +
                                    cjs.f.html_escape(pg.settings.style) +
                                    '" ></div>';
                        } else {
                            html += '<div id="' + pg.ids[i] + '" ></div>';
                        }
                    }
                    return html;
                };

                pg.before_add_event = function () {
                    pg.clean_up();
                    for (var i = 0; i < pg.data.length; i++) {
                        if (cjs.o[pg.data[i]]) {
                            pg.cards.push(cjs.o[pg.data[i]].cNew(pg.ids[i]).show());
                        } else {
                            throw 'PAGE: ' + pg.data[i] + ' not define!';
                        }
                    }
                };

                pg.clean_up = function () {
                    for (var i = 0; i < pg.cards.length; i++) {
                        if (pg.cards[i]) {
                            pg.cards[i].destroy();
                        }
                    }
                    pg.cards = [];
                };
                //do not call show() here! 
                //pg.show();
                return pg;
            }
        };

        cjs.PANEL = {
            // PANEL是对多个PAGE的整合，建议和example.js中的代码一起看。
            cNew: function (container_id, pages, panel_style) {
                var pn = cjs.CARD.cNew(container_id);

                pn.f.merge({
                    name: 'PANEL',
                    id_header: 'panel',
                    add_event: true,
                    style: panel_style
                });

                pn.pages = pages;

                if (!cjs.f.isArray(pn.pages) || pn.pages.length <= 0) {
                    throw 'PANEL(container_id, pages) pages should be an array. \n'
                            + 'eg. ["MainPage",["top_card","middle_card","bottom_card"]]';
                }

                pn.cjsv.cur_page = null;
                pn.cjsv.cur_pn = -1;
                pn.settings.id_num = pn.pages.length + 1;

                pn.clean_up = function () {
                    if (pn.cjsv.cur_page) {
                        pn.cjsv.cur_page.destroy();
                    }
                    pn.cjsv.cur_page = null;
                };

                pn.show_page = function (n) {
                    var num = pn.pages.length;
                    n = cjs.f.clamp(n, 0, num);
                    if (pn.cjsv.cur_pn === n) {
                        return;
                    }
                    pn.cjsv.cur_pn = n;
                    // 改用css控制显示效果
                    pn.clean_up();
                    pn.cjsv.cur_page = cjs.PAGE.cNew(
                            pn.ids[num],
                            pn.pages[n][1],
                            pn.settings.style['card']).show();
                    if (pn.settings.style['active']) {
                        for (var i = 0; i < num; ++i) {
                            if (pn.settings.style['tag']) {
                                pn.objs[i].setAttribute('class', cjs.f.html_escape(pn.settings.style['tag']));
                            }
                        }
                        pn.objs[n].setAttribute('class', cjs.f.html_escape(pn.settings.style['active']));
                    }
                };

                pn.gen_ev_handler = function () {
                    pn.ev_handler = [];
                    for (var i = 0; i < pn.pages.length; ++i) {
                        pn.ev_handler[i] = (function () {
                            var n = i;
                            return(function () {
                                pn.show_page(n);
                            });
                        }());
                    }
                };

                pn.add_event = function () {
                    for (var i = 0; i < pn.pages.length; ++i) {
                        pn.f.on('click', i);
                    }
                };

                pn.after_add_event = function () {
                    pn.show_page(0);
                };

                pn.gen_html = function () {
                    var html = '<div style="margin: 8px;">';
                    var num = pn.pages.length;
                    if (num > 0) {
                        html += '<div>';
                        for (var i = 0; i < num; ++i) {
                            if (pn.settings.style['tag']) {
                                html += '<input type="button" ' +
                                        'class="' + cjs.f.html_escape(pn.settings.style['tag']) + '" ' +
                                        'id="' + pn.ids[i] + '" ' +
                                        'value="' + pn.pages[i][0] + '" >';
                            } else {
                                html += '<input type="button" ' +
                                        'id="' + pn.ids[i] + '" ' +
                                        'value="' + pn.pages[i][0] + '" >';
                            }
                        }
                        html += '</div>';
                    }

                    html += '<div id="' + pn.ids[num] + '" ';
                    if (pn.settings.style['page']) {
                        html += ' class="' + cjs.f.html_escape(pn.settings.style['page']) + '" ';
                    }
                    html += ' ></div></div>';
                    return html;
                };
                return pn;
            }
        };

        return cjs;
    }
};