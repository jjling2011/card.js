// GPL v3

/* global cardjs, sain */

/*
 * 生成一个cardjs实例
 * 其实就是给cardjs改个你喜欢的名字此后都不用打 cardjs.***。
 * 
 * 整个cardjs只有一个cNew函数，结构如下：
 * cNew:function( 容器ID ){
 *   f: 各个通用小函数，例如：html_escape()将“&<>”这些符号过滤掉。
 *   o: 存放各个由cardjs派生出来的对象，留给PAGE及PANEL调用。
 *   CARD: “卡片”对象(后面创建时再详细说明）。
 *   PAGE: “页”对象(后面创建时再详细说明）。
 *   PANEL: “面板”对象(后面创建时再详细说明）。
 * }
 * 
 */


var eg = cardjs.cNew();

/*
 * 创建实例后你还可以继续添加对象。
 * 例如: eg.data={} 
 * 然后各个对象就可以用 eg.data.msg='hello'; 的方式交换数据。
 */

/*
 *  创建一个简单的卡片对象。
 *  
 *  CARD的show函数执行过和如下（请对照card.js中的代码来看）：
 *  1.remove_event 删除之前绑定的事件（多次调用show时会用到）。
 *  2.data_parser 数据处理函数(动态读取serv.php数据时会用到)
 *  3.gen_html 生成界面html代码
 *  4.gen_ev_handler 生成事件响应函数
 *  5.add_event 绑定事件与响应函数
 */
eg.o.simple_card = {
    cNew: function (container_id) {

        // 创建一个CARD实例。
        var scard = eg.CARD.cNew(container_id);

        // 修改界面代码
        scard.gen_html = function () {
            return '<div class="cjs-card-div">这是一个简单的卡片示例</div>';
        };

        // 显示。  
        scard.show();
        return scard;
    }
};

// 创建一个包含事件的卡片对象。
eg.o.timer_card = {
    cNew: function (container_id) {
        var tcard = eg.CARD.cNew(container_id);

        //合并设置项，注意区分 eg.f 及 tcard.f
        tcard.f.merge({
            id_num: 3,
            id_header: 'tcard',
            add_event: true
        });

        tcard.gen_html = function () {
            return '<div class="cjs-card-div">' +
                    '<input type="button" id="' + tcard.ids[0] + '" value="显示时间" class="cjs-btn">' +
                    '<input type="button" id="' + tcard.ids[1] + '" value="停止" class="cjs-btn">' +
                    '<div class="cjs-timer-text" id="' + tcard.ids[2] + '"></div>' +
                    '</div>';
        };

        // 创建一个显示当前时间的函数
        tcard.update = function () {
            tcard.objs[2].innerHTML = (new Date()).toLocaleString();
            // for debug
            console.log(tcard.ids[2] + ": " + tcard.objs[2].innerHTML);
        };

        // 生成处理事件的函数组（名字必须用 ev_handler）
        tcard.gen_ev_handler = function () {
            tcard.ev_handler = [
                function () {
                    /*
                     * 通过 cjs.CARD.f.set_timer设置的时钟，
                     * 在重绘、销毁时会自动删除。
                     * 可以通过些函数的第三个参数来设置多个时钟。
                     * 详见 card.js 的 cjs.CARD.f.set_timer 函数。
                     */
                    tcard.f.set_timer(tcard.update, 1000);
                },
                function () {
                    tcard.f.clear_timer();
                }
            ];
        };

        /*
         * 将事件与ev_handler处理函数绑定起来。
         * 通过 obj.f.on 绑定的事件在重绘(show)或销毁(destroy)时自动释放。
         * 也可以用 obj.f.off 手工解绑。
         * 
         * 特殊情况可以在add_event中手工添加事件，然后：
         *  tcard.remove_event=functio(){
         *      ... 解绑代码 ...
         *  };
         */

        tcard.add_event = function () {
            tcard.f.on('click', 0, 0);
            tcard.f.on('click', 1, 1);
        };

        tcard.show();
        return tcard;
    }
};

// 多个卡合并起来动态切换。
eg.o.my_panel = {
    cNew: function (container_id) {
        var mp = eg.PANEL.cNew(container_id,
                [
                    ['简单卡片', ['simple_card']],
                    ['显示时间', ['timer_card']],
                    ['多卡片混合', ['simple_card', 'timer_card', 'simple_card']]
                ],
                // panel 调用 example.css 中的样式
                        {
                            // 顶上的标签按钮
                            'tag': 'cjs-pn-tag',
                            // 各个“页”的外框
                            'page': 'cjs-pn-div',
                            // 各个“卡片”的外框
                            'card': 'cjs-card-div',
                            // 选中时
                            'active': 'cjs-pn-tag-active'
                        }
                );
                mp.show();
                mp.show_page(1);
                return mp;
            }
};

/*
 * 使用 xhr 动态获取数据。
 * 
 * card.js提供两种获取数据方式。
 * 1.cjs.f.fetch(函数名, 参数, 回调函数)，详见下例。
 * 2.cjs.CARD.refresh()。
 * 
 * refresh()其实是对fetch进行封装。
 * 他通过 cjs.CARD.settings.fetch 读取函数名和参数传递给 cjs.CARD.f.fetch()，
 * 获取数据后调用 cjs.CARD.got_data(数据);
 * 上面那个函数只是简单的将数据存入 cjs.CARD.data 然后调用 cjs.CARD.show();
 * 当然你可以重写此函数，对数据进行一些分配和处理。
 * 
 */
eg.o.fetch_data = {
    cNew: function (container_id) {
        var fd = eg.CARD.cNew(container_id);
        fd.f.merge({
            id_num: 3,
            id_header: 'fetch',
            add_event: true
        });

        fd.gen_html = function () {
            return '<div class="cjs-card-div" style="overflow:auto;">' +
                    '<input type="button" id="' + fd.ids[0] + '" value="读取数据" class="cjs-btn" style="float:left;">' +
                    '<div style="float:left;" id="' + fd.ids[1] + '"></div>' +
                    '</div>';
        };

        fd.gen_ev_handler = function () {
            fd.ev_handler = [
                function () {
                    /*
                     * 默认从serv.php获取数据，可以通过 fd.settings.server_page指定。
                     * fd.f.fetch(函数名 ，参数，回调函数);
                     * 函数名：serv.php 中的函数名 写法详见 serv.php
                     * 参数：可以是字符串、数组 或 hash (注意serv.php中要做相应处理)
                     * 回调函数：参数data为json_object 
                     */
                    fd.f.fetch('echo_str', 'helloooo', function (data) {
                        fd.objs[1].innerHTML = eg.f.html_escape(data);
                    });
                }
            ];
        };

        fd.add_event = function () {
            fd.f.on('click', 0, 0);
        };

        fd.show();
        return fd;
    }
};

eg.o.cboard = {
    // 代码没整理,比较乱.
    cNew: function (container_id) {
        var cb = eg.CARD.cNew(container_id);

        cb.f.merge({
            id_num: 19,
            id_header: 'chess_boardd',
            add_event: true
        });

        cb.record = [0, 0, 0];

        cb.gen_html = function () {
            var html = '<div class="cjs-card-div" >' +
                    '<table><tr><td><table>';
            for (var i = 0; i < 3; ++i) {
                html += '<tr>';
                for (var j = 0; j < 3; ++j) {
                    html += '<td><input type="button" id="' + cb.ids[i * 3 + j] + '" class="cjs-chess"></td>';
                }
                html += '</tr>';
            }
            html += '  </table></td>' +
                    '<td style="vertical-align:top;padding-left:8px;">' +
                    '  <table><tr>' +
                    '    <td><input class="cjs-btn" type="button" id="' + cb.ids[9] + '" value="自动"></td>' +
                    '    <td><input class="cjs-btn" type="button" id="' + cb.ids[10] + '" value="停止"></td>' +
                    '    <td><input class="cjs-btn" type="button" id="' + cb.ids[11] + '" value="清理"></td>' +
                    '  </tr><tr>' +
                    '    <td colspan="3" id="' + cb.ids[18] + '"></td>' +
                    '  </tr></table>' +
                    '</td></tr>' +
                    '<tr><td colspan="2">' +
                    '  <table><tr>' +
                    '    <td style="text-align:center;font-size:15px;width:40px;">Jhon</td>' +
                    '    <td><input  type="file" id="' + cb.ids[14] + '" style="width:170px;"></td>' +
                    '    <td><input type="button" id="' + cb.ids[12] + '" value="导出"></td>' +
                    '    <td id="' + cb.ids[13] + '"></td>' +
                    '  </tr><tr>' +
                    '    <td  style="text-align:center;font-size:15px;width:40px;">Sam</td>' +
                    '    <td ><input type="file" id="' + cb.ids[17] + '" style="width:170px;"></td>' +
                    '    <td><input type="button" id="' + cb.ids[15] + '" value="导出"></td>' +
                    '    <td id="' + cb.ids[16] + '"></td>' +
                    '  </tr></table>' +
                    '</td></tr></table>' +
                    '</div>';
            return html;
        };

        cb.read_board = function () {
            var data = [];
            for (var i = 0; i < 9; ++i) {
                //console.log(cb.ogjs[i].v)
                switch (cb.objs[i].value) {
                    case 'X':
                        data.push(1);
                        break;
                    case 'O':
                        data.push(2);
                        break;
                    default:
                        data.push(0);
                }
            }
            return data;
        };

        cb.done = function (d) {
            var c = 0;
            d.forEach(function (e) {
                if (e) {
                    c++;
                }
            });
            return c >= 9;
        };

        cb.check = function (b) {
            if (b[4] !== 0) {
                if (b[0] === b[4] && b[4] === b[8]) {
                    return(b[4]);
                }
                if (b[2] === b[4] && b[4] === b[6]) {
                    return(b[4]);
                }
            }

            var mark;
            for (var i = 0; i < 3; ++i) {
                mark = [0, 0];
                for (var j = 0; j < 3; ++j) {
                    if (b[i * 3] !== 0 && b[i * 3 + 0] === b[i * 3 + j]) {
                        if (++mark[0] >= 3) {
                            return b[i * 3];
                        }
                    }
                    if (b[i] !== 0 && b[i] === b[i + j * 3]) {
                        if (++mark[1] >= 3) {
                            return b[i];
                        }
                    }
                }
            }
            return 0;
        };

        cb.place_chess = function (pos, type) {
            if (pos === null)
                return false;
            if (cb.objs[pos].value === '') {
                cb.objs[pos].value = type;
                return true;
            } else {
                console.log('Can not set chess ' + type + ' in ' + pos);
            }
            return false;
        };


        cb.move = function () {
            var board = cb.read_board();
            var jmov = cb.jhon.process(board);
            if (jmov || jmov === 0) {
                cb.place_chess(jmov, 'X');
                board[jmov] = 1;
                var res = cb.check(board);
                if (!cb.done(board) && !res) {
                    var smov = cb.sam.process(board);
                    if (smov || smov === 0) {
                        cb.place_chess(smov, 'O');
                        board[smov] = 2;
                    }
                    res = cb.check(board);
                }
                if (cb.done(board) || res) {
                    cb.summary(res, ['draw game', 'Jhon&nbsp;win', 'Sam &nbsp;win']);
                    cb.jhon.feedback(res);
                    var rsam = [0, 2, 1];
                    cb.sam.feedback(rsam[res]);
                    cb.ev_handler[11]();
                }
            }
        };

        cb.single_move = function () {
            var board = cb.read_board();
            var r = cb.check(board);
            if (!cb.done(board) && !r) {
                var jmov = cb.jhon.process(board);
                cb.place_chess(jmov, 'O');
                board[jmov] = 2;
                r = cb.check(board);
            }
            if (cb.done(board) || r) {
                cb.summary(r, ['draw game', 'you win', 'you lost']);
                cb.jhon.feedback(r);
                cb.ev_handler[11]();
            }
        };

        cb.summary = function (r, msg) {
            ++cb.record[r];
            var html = '---&lt; ' + msg[r] + ' &gt;--- </br>' +
                    '[' + cb.record[0] + ',' + cb.record[1] + ',' + cb.record[2] + ']</br>' +
                    'Jhon:' + cb.jhon.v.last_id + '</br>' +
                    'Sam :' + cb.sam.v.last_id + '</br>';
            cb.objs[18].innerHTML = html;
        };

        cb.process = function () {
            var board = cb.read_board();
            var r = cb.check(board);
            if (!cb.done(board) && !r) {
                var jmov = cb.jhon.process(board);
                if (cb.place_chess(jmov, 'O')) {
                    board[jmov] = 2;
                    r = cb.check(board);
                }
            }
            if (cb.done(board) || r) {
                var msg = ['draw game', 'you win', 'you lost'];
                console.log('------< ' + msg[r] + ' >------');
                ++cb.record[r];
                console.log(cb.record);
                console.log('Jhon: ' + cb.jhon.child_id);
                cb.jhon.feedback(r);
                cb.ev_handler[11]();
            }
        };

        cb.gen_ev_handler = function () {
            cb.ev_handler = [];
            for (var i = 0; i < 9; ++i) {
                cb.ev_handler[i] = function () {
                    var id = i;
                    return function () {
                        if (!cb.place_chess(id, 'X')) {
                            return;
                        }
                        cb.single_move();
                    };
                }();
            }
            cb.ev_handler[11] = function () {
                for (var i = 0; i < 9; ++i) {
                    cb.objs[i].value = null;
                }
            };
            cb.ev_handler[9] = function () {
                cb.f.set_timer(cb.move, 100);
            };
            cb.ev_handler[10] = function () {
                cb.f.clear_timer();
            };
            cb.ev_handler[12] = function () {
                var url = cb.jhon.save();
                cb.objs[13].innerHTML = '<a href="' + url + '" download="Jhon.json">Jhon</a>';
            };
            cb.ev_handler[15] = function () {
                var url = cb.sam.save();
                cb.objs[16].innerHTML = '<a href="' + url + '" download="Sam.json">Sam</a>';
            };
            cb.ev_handler[14] = function () {
                var file = cb.objs[14].files[0];
                if (file && file.size) {
                    var reader = new FileReader();
                    reader.onload = function (f) {
                        var obj = JSON.parse(f.target.result);
                        // console.log(obj);
                        cb.jhon = sain.NETWORK.cNew();
                        cb.jhon.load(obj);
                        console.log('Jhon: hello every body!');
                    };
                    reader.readAsText(file);
                } else {
                    console.log("file error!");
                }
            };
            cb.ev_handler[17] = function () {
                var file = cb.objs[17].files[0];
                if (file && file.size) {
                    var reader = new FileReader();
                    reader.onload = function (f) {
                        var obj = JSON.parse(f.target.result);
                        // console.log(obj);
                        cb.sam = sain.NETWORK.cNew();
                        cb.sam.load(obj);
                        console.log('Sam: hello every body!');
                    };
                    reader.readAsText(file);
                } else {
                    console.log("file error!");
                }
            };
        };

        cb.add_event = function () {
            for (var i = 0; i < 9; ++i) {
                cb.f.on('click', i, i);
            }
            [9, 10, 11, 12, 15].forEach(function (e) {
                cb.f.on('click', e, e);
            });
            [14, 17].forEach(function (e) {
                cb.f.on('change', e, e);
            });
        };

        cb.jhon = sain.NETWORK.cNew();
        cb.sam = sain.NETWORK.cNew();

        cb.show();
        return cb;
    }
};