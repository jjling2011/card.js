// GPL v3

/* global sain,CardJS */

/*
 * CardJS导出以下三个对象：
 *   Lib: 各小函数，直接调用即可，不需要生成实例。
 *        例如：html_escape()将“&<>”这些符号过滤掉。
 *   Card: “卡片”对象，CardJS的基础组件。
 *   Page: “页”对象，即有一个div将多个Card包装起来。
 *   Panel: “面板”对象，动态创建/删除Page，类似浏览器的标签栏。
 * 
 */

//创建一个对象，存放通过CardJS生成的各种实例。
var web = {
    //实例都存放到o下方便管理
    o: {},
    //各个对象缓存数据或交换数据（本例未使用）
    cache: {}
};

/*
 *  创建一个简陋Card对象。
 *  
 *  CardJS.Card的show函数执行过和如下（请对照card.js中的代码来看）：
 *  1.remove_event 删除之前绑定的事件（多次调用show时会用到）。
 *  2.data_parser 数据处理函数(动态读取serv.php数据时会用到)
 *  3.gen_html 生成界面html代码
 *  4.gen_ev_handler 生成事件响应函数
 *  5.add_event 绑定事件与响应函数
 */
web.o.card = function (cid) {
    // 创建一个Card实例。
    var o = new CardJS.Card(cid);

    // 修改界面代码
    o.gen_html = function () {
        return '<div class="card-div">这是一个简单的卡片示例</div>';
    };

    return o;
};

// 创建一个可以响应事件的Card对象。
web.o.card_ev = function (container_id) {
    var o = new CardJS.Card(container_id);

    //修改设置
    o.f.merge({
        header: 'tcard',
        add_event: true
    });

    o.gen_html = function () {
        return '<div class="card-div">' +
                '<input type="button" id="' + o.el(0) + '" value="显示时间" class="card-btn">' +
                '<input type="button" id="' + o.el(1) + '" value="停止" class="card-btn">' +
                '<div class="card-text" id="' + o.el(2) + '"></div>' +
                '</div>';
    };

    // 创建一个显示当前时间的函数
    o.update = function () {
        o.el(2, true).innerHTML = (new Date()).toLocaleString();
        window.console.log(o.el(2) + ": " + o.el(2, true).innerHTML);
    };

    // 生成处理事件的函数组,返回值 [func1,func2,func3, ... ]
    o.gen_ev_handler = function () {
        var evs = [
            function () {
                /*
                 * 通过 cjs.CARD.f.set_timer设置的时钟，
                 * 在重绘、销毁时会自动删除。
                 * 可以通过些函数的第三个参数来设置多个时钟。
                 * 详见 card.js 的 cjs.CARD.f.set_timer 函数。
                 */
                o.f.set_timer(o.update, 1000);
            },
            function () {
                o.f.clear_timer();
            }
        ];
        return evs;
    };

    /*
     * 将事件与ev_handler处理函数绑定起来。
     * 通过 obj.f.on( ... ) 绑定的事件在重绘(show)或销毁(destroy)时自动释放。
     * 也可以用 obj.f.off( ... ) 手工解绑。
     * 
     * 特殊情况可以在add_event中手工添加事件，然后：
     *  o.remove_event=functio(){
     *      ... 解绑代码 ...
     *  };
     */

    o.add_event = function () {
        o.f.on('click', 0);
        o.f.on('click', 1);
    };

    return o;
};

// 多个卡合并起来动态切换。
web.o.panel = function (cid) {
    var o = new CardJS.Panel(cid, {
        '简单卡片': [web.o.card],
        '显示时间': [web.o.card_ev],
        '多卡片混合': [web.o.card, web.o.card_ev, web.o.card_fetch]
    }, {
        'tags': 'tags',
        'tag_normal': 'tag-normal',
        'tag_active': 'tag-active',
        'page': 'page',
        'card': 'card'
    });
    return o;
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
web.o.card_fetch = function (container_id) {
    var o = new CardJS.Card(container_id);
    o.f.merge({
        header: 'fetch',
        add_event: true
    });

    o.gen_html = function () {
        return '<div class="card-div" style="overflow:auto;">' +
                '<input type="button" id="' + o.el(0) + '" value="读取数据" class="card-btn" style="float:left;">' +
                '<div style="float:left;" id="' + o.el(1) + '">*需php支持*</div>' +
                '</div>';
    };

    o.gen_ev_handler = function () {
        var evs = [
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
                o.f.fetch('checklogin', ['Amy', 'Adam'], function (data) {
                    //console.log(data);
                    o.el(1, true).innerHTML = CardJS.Lib.html_escape(window.JSON.stringify(data));
                });
                //fd.destroy();
            }
        ];
        return evs;
    };

    o.add_event = function () {
        o.f.on('click', 0);
    };

    return o;
};


web.o.cboard = function (container_id) {
    var cb = new CardJS.Card(container_id);

    cb.f.merge({
        header: 'chess_boardd',
        add_event: true
    });

    cb.record = [0, 0, 0, 0];
    cb.lock = false;

    cb.gen_html = function () {
        var html = '<div class="card-div" >' +
                '<table><tr><td><table>';
        for (var i = 0; i < 3; ++i) {
            html += '<tr>';
            for (var j = 0; j < 3; ++j) {
                html += '<td><input type="button" id="' + cb.el(i * 3 + j) + '" class="chess" title="点击下棋"></td>';
            }
            html += '</tr>';
        }
        html += '  </table></td>' +
                '<td style="vertical-align:top;padding-left:2px;">' +
                '  <table><tr>' +
                '    <td><input class="cjs-btn" type="button" id="' + cb.el(9) + '" value="训练" title="Jhon和Sam对决。\n3秒调用一次，每次300盘。\n有时电脑太忙会反应慢点。\n按后面的【停止】结束。"></td>' +
                '    <td><input class="cjs-btn" type="button" id="' + cb.el(10) + '" value="停止" title="停止训练"></td>' +
                '    <td><input class="cjs-btn" type="button" id="' + cb.el(11) + '" value="清理" title="清理棋盘，恢复初始状态。"></td>' +
                '  </tr><tr>' +
                '    <td colspan="3" id="' + cb.el(18) + '" style="font-size:14px;padding-top:5px;">说明：</br>空白处点击开始游戏。</br>按钮上停1秒会有提示。</td>' +
                '  </tr></table>' +
                '</td></tr>' +
                '<tr><td colspan="2">' +
                '  <table><tr>' +
                '    <td style="text-align:center;"><input type="button" id="' + cb.el(19) + '" value="Jhon" title="选Jhon作为对手（Jhon会先下第一手）。"></td>' +
                '    <td><input  type="file" id="' + cb.el(14) + '" style="width:170px;" title="导入Jhon的训练数据"></td>' +
                '    <td><input type="button" id="' + cb.el(12) + '" value="导出" title="导出Jhon的训练数据" ></td>' +
                '    <td id="' + cb.el(13) + '"></td>' +
                '  </tr><tr>' +
                '    <td  style="text-align:center;"><input type="button" id="' + cb.el(20) + '" value="Sam" title="选Sam作为对手（玩家下第一手）。"></td>' +
                '    <td ><input type="file" id="' + cb.el(17) + '" style="width:170px;" title="导入Sam的训练数据"></td>' +
                '    <td><input type="button" id="' + cb.el(15) + '" value="导出"  title="导出Sam的训练数据" ></td>' +
                '    <td id="' + cb.el(16) + '"></td>' +
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
            cb.el(i,true).value = chess[cb.board[i]];
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
        cb.el(18,true).innerHTML = html;
    };

    cb.revers_board = function (b) {
        var new_board = [];
        var chess = [0, 2, 1];
        for (var i = 0; i < b.length; i++) {

            new_board.push(chess[b[i]]);
        }
        return new_board;
    };

    cb.gen_ev_handler = function () {
        var evs = [];
        for (var i = 0; i < 9; ++i) {
            evs[i] = function () {
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
                        cb.f.trigger(11);
                        if (cb.com.name === 'jhon') {
                            cb.first_move();
                        }
                    }
                };
            }();
        }
        evs[11] = function () {
            cb.init_board();
            cb.jhon.reset();
            cb.sam.reset();
            cb.show_board();
        };
        evs[9] = function () {
            cb.init_board();
            cb.f.set_timer(cb.auto, 3000);
        };
        evs[10] = function () {
            cb.f.clear_timer();
        };
        evs[12] = function () {
            var url = cb.jhon.save();
            cb.el(13,true).innerHTML = '<a href="' + url + '" download="Jhon.json">Jhon</a>';
        };
        evs[15] = function () {
            var url = cb.sam.save();
            cb.el(16,true).innerHTML = '<a href="' + url + '" download="Sam.json">Sam</a>';
        };
        evs[14] = function () {
            var file = cb.el(14,true).files[0];
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
        evs[17] = function () {
            var file = cb.el(17,true).files[0];
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
        evs[19] = function () {
            cb.f.trigger(11);
            cb.com = cb.jhon;
            cb.first_move();
            console.log('Jhon: online!');
            cb.el(19,true).setAttribute('class', 'cjs-btn-blue');
            cb.el(20,true).setAttribute('class', 'cjs-btn');

        };
        evs[20] = function () {
            cb.f.trigger(11);
            cb.com = cb.sam;
            console.log('Sam: online!');
            cb.el(20,true).setAttribute('class', 'cjs-btn-blue');
            cb.el(19,true).setAttribute('class', 'cjs-btn');
        };
        return evs;
    };

    cb.first_move = function () {
        cb.place_chess(cb.com.process(cb.board), 2);
        cb.show_board();
    };

    cb.add_event = function () {
        var i;
        for (i = 0; i < 9; ++i) {
            cb.f.on('click', i);
        }
        var d = [9, 10, 11, 12, 15, 19, 20];
        for (i = 0; i < d.length; i++) {
            cb.f.on('click', d[i]);
        }
        ;
        d = [14, 17];
        for (i = 0; i < d.length; i++) {

            cb.f.on('change', d[i]);
        }
    };

    cb.after_add_event = function () {
        cb.init_board();
        cb.jhon = sain.NETWORK.cNew('jhon');
        cb.sam = sain.NETWORK.cNew('sam');
        cb.com = cb.sam;
        cb.el(19,true).setAttribute('class', 'cjs-btn');
        cb.el(20,true).setAttribute('class', 'cjs-btn-blue');
    };

    return cb;
}
;
