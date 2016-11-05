/* 
 * GPL v3 
 * jjling at gmail dot com 
 * 2016-10-30
 * 
 */

var cardjs = {
    cNew: function () {
        var cjs = {
            //存放通过cardjs生成的对象,在CARD/PAGE/PANEL之间相互调用。
            o: {}
        };
        //各通用函数
        cjs.f = {
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
            gen_ids: function (head, num, len) {
                len = len || 16;
                var rid = head + '_' + cjs.f.rand(16) + '_';
                var rtv = new Array();
                for (var i = 0; i < num; ++i) {
                    rtv.push(rid + i);
                }
                return rtv;
            },
            gen_objs: function (ids) {
                var rtv = new Array();
                ids.forEach(function (e) {
                    rtv.push(document.getElementById(e));
                });
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
            }

        };
        cjs.CARD = {
            cNew: function (container_id) {
                var card = {
                    f: {}
                };
                card.f = {
                    on: function (event, obj_index, handler_index) {
                        card.objs[obj_index].addEventListener(event, card.ev_handler[handler_index], false);
                        card.cjsv.evs[obj_index] = [event, handler_index];
                        //console.log(card.cjsv.evs);
                    },
                    off: function (event, obj_index, handler_index) {
                        card.objs[obj_index].removeEventListener(event, card.ev_handler[handler_index], false);
                        if (card.cjsv.evs[obj_index]) {
                            delete card.cjsv.evs[obj_index];
                            //console.log(card.cjsv.evs);
                        }
                    },
                    merge: function (s) {
                        for (var key in s) {
                            card.settings[key] = s[key];
                        }
                    },
                    clear_timer: function (num) {
                        // console.log('clear_timer:');
                        num = num || 0;
                        // console.log(this);
                        if (card.cjsv.timer[num]) {
                            clearInterval(card.cjsv.timer[num]);
                        }
                        card.cjsv.timer = [];
                    },
                    set_timer: function (call_back, interval, num) {
                        // console.log('set_timer:');
                        num = num || 0;
                        interval = interval || 3000;
                        card.f.clear_timer(num);
                        call_back();
                        card.cjsv.timer[num] = setInterval(call_back, interval);
                    },
                    show_loading_tip: function (id) {
                        if (card.settings.loading_tip_delay > 0) {
                            if (card.cjsv.loading_tip_timer) {
                                clearTimeout(card.cjsv.loading_tip_timer);
                            }
                            card.cjsv.loading_tip_timer =
                                    setTimeout(function () {
                                        document.getElementById(id).innerHTML =
                                                '加载中... 长时间无反应可以 ' +
                                                '<a href="#" onclick="window.location.reload(true);">刷新一下</a>';
                                    }.bind(id), card.settings.loading_tip_delay);
                        }
                    },
                    fetch: function (op, param, func, verbose) {
                        if (!cjs.f.isString(param)) {
                            param = JSON.stringify(param);
                        }
                        var xhr = new XMLHttpRequest();
                        xhr.open('POST', card.settings.server_page);
                        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                        xhr.onload = function () {
                            if (xhr.status === 200) {
                                var raw_rsp = xhr.responseText;
                                if (verbose) {
                                    console.log('Fetch.raw:\n' + raw_rsp);
                                }
                                var rsp = JSON.parse(raw_rsp);
                                if (rsp && rsp.status && rsp.data) {
                                    func(rsp.data);
                                } else {
                                    console.log('Fetch: fail!');
                                    console.log(rsp);
                                }
                            } else {
                                console.log('Fetch: Error code ' + xhr.status);
                            }
                        };
                        xhr.send(encodeURI('op=' + op + '&data=' + param));
                    },
                    set_html: function (html) {
                        document.getElementById(card.cjsv.container_id).innerHTML = html;
                    }
                };
                function get_virtual_method(func_name) {
                    var fn = [].concat(func_name);
                    fn.forEach(function (e) {
                        card[e] = function () {
                            if (card.settings.verbose) {
                                console.log('CARD.' + fn + '(): please rewrite this function!');
                            }
                            return false;
                        };
                    });
                }

                function release_event() {
                    if (card.cjsv.evs.length > 0) {
                        //console.log(card.cjsv.evs);
                        for (var key in card.cjsv.evs) {
                            //console.log(card.cjsv.evs);
                            if (card.cjsv.evs[key]) {
                                card.f.off(card.cjsv.evs[key][0], key, card.cjsv.evs[key][1]);
                                delete card.cjsv.evs[key];
                            }
                            
                        }
                        card.cjsv.evs = [];
                    }
                }

                function call_method(fn, warn) {
                    if (fn in card) {
                        card[fn]();
                    } else {
                        if (warn && card.settings.verbose) {
                            console.log('Call undefine method: Card.' + fn + '()');
                        }
                    }
                }

                card.cjsv = {
                    timer: [],
                    evs: [],
                    container_id: container_id,
                    loading_tip_timer: null,
                    event_flag: false
                };

                card.settings = {
                    loading_tip_delay: 0,
                    server_page: 'serv.php',
                    id_num: 0,
                    id_header: 'id',
                    add_event: false,
                    fetch: false,
                    verbose: false
                };

                card.show = function () {
                    if (card.cjsv.event_flag) {
                        //console.log('show');
                        call_method('remove_event', true);
                        release_event();
                        card.cjsv.event_flag = false;
                    }
                    call_method('data_parser');
                    if (card.settings.id_num >= 1) {
                        card.ids = cjs.f.gen_ids(card.settings.id_header, card.settings.id_num);
                    }
                    card.f.set_html(card.gen_html());
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
                };
                
                get_virtual_method('gen_html');
                
                card.destroy = function () {
                    if (card.cjsv.event_flag) {
                        call_method('remove_event', true);
                        release_event();
                        card.cjsv.event_flag = false;
                    }
                    card.cjsv.timer.forEach(function (e) {
                        clearInterval(e);
                    });
                    card.cjsv.timer = [];
                    call_method('clean_up');
                };
                
                card.refresh = function () {
                    card.f.show_loading_tip(card.cjsv.container_id);
                    if (card.settings.fetch) {
                        card.f.fetch(card.settings.fetch[0],
                                card.settings.fetch[1],
                                card.got_data,
                                card.settings.verbose);
                    } else {
                        card.show();
                    }
                };
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
        
        cjs.PANEL = {
            cNew: function (container_id, pages, panel_style) {
                var pn = cjs.CARD.cNew(container_id);

                pn.f.merge({
                    id_header: 'panel',
                    add_event: true,
                    style: panel_style
                });

                pn.cjsv.cur_page = null;

                pn.pages = pages;

                if (!Array.isArray(pn.pages) || pn.pages.length <= 0) {
                    throw 'PANEL(container_id, pages) pages should be an array. \n'
                            + 'eg. ["MainPage",["top_card","middle_card","bottom_card"]]';
                }

                pn.settings.id_num = pn.pages.length + 1;

                pn.clean_up = function () {
                    if (pn.cjsv.cur_page) {
                        //console.log('page_clean_up');
                        pn.cjsv.cur_page.destroy();
                    }
                    pn.cjsv.cur_page = null;
                };

                pn.show_page = function (n) {
                    var num = pn.pages.length;
                    // 改用css控制显示效果
                    pn.clean_up();
                    pn.cjsv.cur_page = cjs.PAGE.cNew(
                            pn.ids[num],
                            pn.pages[n][1],
                            pn.settings.style['card']);
                    pn.cjsv.cur_page.show();
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
                        pn.f.on('click', i, i);
                    }
                };

                pn.gen_html = function () {
                    var html = '<div style="margin: 8px;">';
                    var num = pn.pages.length;
                    if (num > 0) {
                        html += '<div>';
                        for (var i = 0; i < num; ++i) {
                            if (pn.settings.style['tag']) {
                                html += '<input type="button" class="' + cjs.f.html_escape(pn.settings.style['tag']) + '"'
                                        + ' id="' + pn.ids[i] + '" value="' + pn.pages[i][0] + '" >';
                            } else {
                                html += '<input type="button" id="' + pn.ids[i] + '" value="' + pn.pages[i][0] + '" >';
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

        cjs.PAGE = {
            cNew: function (container_id, cards, cjs_page_style) {
                var pg = cjs.CARD.cNew(container_id);

                pg.settings.id_header = 'page';
                pg.settings.style = cjs_page_style;

                pg.cards = [];

                pg.data_parser = function () {
                    if (!Array.isArray(cards) || cards.length <= 0) {
                        throw 'Error: PAGE(container_id,cards) cards should be an array!';
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
                    pg.data.forEach(function (e, i) {
                        if (cjs.o[e]) {
                            pg.cards.push(cjs.o[e].cNew(pg.ids[i]));
                        } else {
                            throw 'PAGE: ' + e + ' not define!';
                        }
                    });
                };

                pg.clean_up = function () {
                    pg.cards.forEach(function (e) {
                        if (e) {
                            e.destroy();
                        }
                    });
                    pg.cards = [];
                };
                //do not call show() here! 
                //pg.show();
                return pg;
            }
        };
        return cjs;
    }
};