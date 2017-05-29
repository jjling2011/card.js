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


var eg = CardJS.cNew();

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
        //scard.show();
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
            tcard.f.on('click', 0);
            tcard.f.on('click', 1);
        };

        //tcard.show();
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
                    ['多卡片混合', ['timer_card', 'simple_card', 'fetch_data']]
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
                //mp.show();
                //mp.show_page(1);
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
                    '<div style="float:left;" id="' + fd.ids[1] + '">*需php支持*</div>' +
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
//                    fd.f.fetch('echo_str', 'helloooo!', function (data) {
//                        fd.objs[1].innerHTML = eg.f.html_escape(data);
//                    });
                    fd.f.fetch('checklogin', ['Amy','Adam'], function (data) {
                        //console.log(data);
                        fd.objs[1].innerHTML = eg.f.html_escape(JSON.stringify(data));
                    });
                    //fd.destroy();
                }
            ];
        };

        fd.add_event = function () {
            fd.f.on('click', 0);
        };

        //fd.show();
        return fd;
    }
};

eg.o.cboard = {
    // 代码没整理,比较乱.
    cNew: function (container_id) {
        var cb = eg.CARD.cNew(container_id);

        cb.f.merge({
            id_num: 21,
            id_header: 'chess_boardd',
            add_event: true
        });

        cb.record = [0, 0, 0, 0];
        cb.lock = false;

        cb.gen_html = function () {
            var html = '<div class="cjs-card-div" >' +
                    '<table><tr><td><table>';
            for (var i = 0; i < 3; ++i) {
                html += '<tr>';
                for (var j = 0; j < 3; ++j) {
                    html += '<td><input type="button" id="' + cb.ids[i * 3 + j] + '" class="cjs-chess" title="点击下棋"></td>';
                }
                html += '</tr>';
            }
            html += '  </table></td>' +
                    '<td style="vertical-align:top;padding-left:2px;">' +
                    '  <table><tr>' +
                    '    <td><input class="cjs-btn" type="button" id="' + cb.ids[9] + '" value="训练" title="Jhon和Sam对决。\n3秒调用一次，每次300盘。\n有时电脑太忙会反应慢点。\n按后面的【停止】结束。"></td>' +
                    '    <td><input class="cjs-btn" type="button" id="' + cb.ids[10] + '" value="停止" title="停止训练"></td>' +
                    '    <td><input class="cjs-btn" type="button" id="' + cb.ids[11] + '" value="清理" title="清理棋盘，恢复初始状态。"></td>' +
                    '  </tr><tr>' +
                    '    <td colspan="3" id="' + cb.ids[18] + '" style="font-size:14px;padding-top:5px;">说明：</br>空白处点击开始游戏。</br>按钮上停1秒会有提示。</td>' +
                    '  </tr></table>' +
                    '</td></tr>' +
                    '<tr><td colspan="2">' +
                    '  <table><tr>' +
                    '    <td style="text-align:center;"><input type="button" id="' + cb.ids[19] + '" value="Jhon" title="选Jhon作为对手（Jhon会先下第一手）。"></td>' +
                    '    <td><input  type="file" id="' + cb.ids[14] + '" style="width:170px;" title="导入Jhon的训练数据"></td>' +
                    '    <td><input type="button" id="' + cb.ids[12] + '" value="导出" title="导出Jhon的训练数据" ></td>' +
                    '    <td id="' + cb.ids[13] + '"></td>' +
                    '  </tr><tr>' +
                    '    <td  style="text-align:center;"><input type="button" id="' + cb.ids[20] + '" value="Sam" title="选Sam作为对手（玩家下第一手）。"></td>' +
                    '    <td ><input type="file" id="' + cb.ids[17] + '" style="width:170px;" title="导入Sam的训练数据"></td>' +
                    '    <td><input type="button" id="' + cb.ids[15] + '" value="导出"  title="导出Sam的训练数据" ></td>' +
                    '    <td id="' + cb.ids[16] + '"></td>' +
                    '  </tr></table>' +
                    '</td></tr><tr><td colspan="2" style="font-size:14px;">' +
                    '你可以下载这些训练数据和电脑对决：</br>' +
                    '<a href="res/Jhon.json" download="Jhon.json">Jhon.json（先手）</a></br>' +
                    '<a href="res/Sam.json" download="Sam.json">Sam.json（后手，比较笨）</a></br>' +
                    '</td></tr></table>' +
                    '</div>';
            return html;
        };

        cb.check = function (b) {
            // 0无 1胜 2胜 3平
            var c = 0;

            for (var i = 0; i < 9; ++i) {
                if (!b[i])
                    c++;
            }

            if (c > 5) {
                return 0;
            }

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

            if (!c) {
                return 3;
            }

            return 0;
        };

        cb.place_chess = function (pos, val) {
            if (cb.board[pos]) {
                console.log('Error: pos has been taken! mark:' + val);
                return false;
            } else {
                cb.board[pos] = val;
                return true;
            }
        };

        cb.init_board = function () {
            cb.board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        };

        cb.show_board = function () {
            var chess = ['', 'X', 'O'];
            for (var i = 0; i < 9; ++i) {
                cb.objs[i].value = chess[cb.board[i]];
            }
        };

        cb.auto = function () {
            if (cb.lock) {
                return;
            }
            cb.lock = true;
            var c = 0, r = 0, rsam = [0, 2, 1, 3];
            do {
                cb.init_board();
                do {
                    cb.place_chess(cb.jhon.process(cb.board), 1);
                    r = cb.check(cb.board);
                    if (!r) {
                        cb.place_chess(cb.sam.process(cb.board), 2);
                        r = cb.check(cb.board);
                    }
                    //cb.show_board();
                    //console.log(r,cb.board);
                } while (!r);
                ++cb.record[r];
                cb.jhon.feedback(r);
                cb.sam.feedback(rsam[r], 'gentle');
            } while (++c < 300);
            cb.show_board();
            cb.summary(r, ['', 'Jhon&nbsp;win!', 'Sam &nbsp;win!', 'Draw game.']);
            //console.log(cb.record, cb.jhon.v.last_id, cb.sam.v.last_id);
            cb.lock = false;
        };

        cb.summary = function (r, msg) {
            ++cb.record[r];
            var html = '----&lt; ' + msg[r] + ' &gt;----<br>' +
                    'Jhon: ' + cb.jhon.v.last_id + ' units<br>' +
                    'Sam : ' + cb.sam.v.last_id + ' units<br><br>' +
                    'X：' + cb.record[1] + ' O：' + cb.record[2] + ' 平：' + cb.record[3];
            cb.objs[18].innerHTML = html;
        };

        cb.revers_board = function (b) {
            var new_board = [];
            var chess = [0, 2, 1];
            for(var i=0;i<b.length;i++){
            
                new_board.push(chess[b[i]]);
            }
            return new_board;
        };

        cb.gen_ev_handler = function () {
            cb.ev_handler = [];
            for (var i = 0; i < 9; ++i) {
                cb.ev_handler[i] = function () {
                    var id = i;
                    return function () {

                        if (!cb.place_chess(id, 1)) {
                            return;
                        }
                        var r;
                        var board = cb.board;
                        if (cb.com.name === 'jhon') {
                            board = cb.revers_board(cb.board);
                        }
                        r = cb.check(cb.board);
                        if (!r) {
                            cb.place_chess(cb.com.process(board), 2);
                            r = cb.check(cb.board);
                        }
                        cb.show_board();
                        if (r) {
                            cb.summary(r, ['', '<font color="red">胜</font>', '负', '平手']);
                            var revfb = [0, 2, 1, 3];
                            if (cb.com.name === 'sam') {
                                cb.com.feedback(revfb[r], 'gentle');
                            } else {
                                cb.com.feedback(revfb[r]);
                            }
                            cb.ev_handler[11]();
                            if (cb.com.name === 'jhon') {
                                cb.first_move();
                            }
                        }
                    };
                }();
            }
            cb.ev_handler[11] = function () {
                cb.init_board();
                cb.jhon.reset();
                cb.sam.reset();
                cb.show_board();
            };
            cb.ev_handler[9] = function () {
                cb.init_board();
                cb.f.set_timer(cb.auto, 3000);
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
                        cb.jhon.load(obj);
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
                        cb.sam.load(obj);
                    };
                    reader.readAsText(file);
                } else {
                    console.log("file error!");
                }
            };
            cb.ev_handler[19] = function () {
                cb.ev_handler[11]();
                cb.com = cb.jhon;
                cb.first_move();
                console.log('Jhon: online!');
                cb.objs[19].setAttribute('class', 'cjs-btn-blue');
                cb.objs[20].setAttribute('class', 'cjs-btn');

            };
            cb.ev_handler[20] = function () {
                cb.ev_handler[11]();
                cb.com = cb.sam;
                console.log('Sam: online!');
                cb.objs[20].setAttribute('class', 'cjs-btn-blue');
                cb.objs[19].setAttribute('class', 'cjs-btn');
            };
        };

        cb.first_move = function () {
            cb.place_chess(cb.com.process(cb.board), 2);
            cb.show_board();
        };

        cb.add_event = function () {
            var i;
            for ( i = 0; i < 9; ++i) {
                cb.f.on('click', i);
            }
            var d=[9, 10, 11, 12, 15, 19, 20];
            for(i=0;i<d.length;i++){
                cb.f.on('click', d[i]);
            };
            d=[14,17];
            for(i=0;i<d.length;i++){
            
                cb.f.on('change', d[i]);
            }
        };

        cb.after_add_event = function () {
            cb.init_board();
            cb.jhon = sain.NETWORK.cNew('jhon');
            cb.sam = sain.NETWORK.cNew('sam');
            cb.com = cb.sam;
            cb.objs[19].setAttribute('class', 'cjs-btn');
            cb.objs[20].setAttribute('class', 'cjs-btn-blue');
        };

        return cb;
    }
};