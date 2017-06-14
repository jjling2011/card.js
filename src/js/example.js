// GPL v3

/* global sain,cardjs */

/*
 * CardJS导出以下三个对象：
 *   set: 初始化设置。
 *   lib: 各小函数，直接调用即可，不需要生成实例。
 *        例如：html_escape()将“&<>”这些符号过滤掉。
 *   create: 封装Card/Page/Panel生成函数。
 * 
 */

//创建一个对象，存放通过CardJS生成的各种实例。
var web = {
    //实例都存放到o下方便管理
    o: {}
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
    return (cardjs.create({
        cid: cid,
        gen_html: function () {
            return '<div class="card-div" style="color:#999;font-size:14px">这是一个什么都没有的卡片</div>';
        }
    }));
};

// 创建一个可以响应事件及共享数据的Card对象。
web.o.card_ev = function (container_id) {

    return (cardjs.create({
        cid: container_id,
        settings: {header: 'tcard', add_event: true},
        gen_html: function () {
            //console.log('gen_html:',this);
            return '<div class="card-div" style="color:#999;font-size:14px">' +
                    '各实例事件相互隔离：<br>'+
                    '<input type="button" id="' + this.el('show_time') + '" value="显示时间" class="card-btn">' +
                    '<input type="button" id="' + this.el('stop') + '" value="停止" class="card-btn">' +
                    '<div class="card-text" id="' + this.el('content_time') + '"></div>' +
                    '共享数据可被各实例读取/修改：<br>'+
                    '<input type="button" id="' + this.el('save') + '" value="生成共享数据" class="card-btn">' +
                    '<input type="button" id="' + this.el('load') + '" value="读取共享数据" class="card-btn">' +
                    '<div class="card-text" id="' + this.el('content_data') + '"></div>' +
                    '</div>';
        },
        update: function () {
            this.el('content_time', true).innerHTML = (new Date()).toLocaleString();
            window.console.log(this.el('content_time') + ':' + this.el('content_time', true).innerHTML);
        },
        gen_ev_handler: function () {
            return ({
                'show_time': function () {
                    this.f.set_timer(this.update, 1000);
                },
                'stop': function () {
                    this.f.clear_timer();
                },
                'save': function () {
                    var content = cardjs.lib.rand(16);
                    this.f.save(content);
                    this.el('content_data', true).innerHTML = '共享数据：' + content;
                },
                'load': function () {
                    var content = this.f.load();
                    this.el('content_data', true).innerHTML = '读取数据：' + content;
                }
            });
        },
        add_event: function () {
            this.f.on('click', 'show_time');
            this.f.on('click', 'stop');
            this.f.on('click', 'save');
            this.f.on('click', 'load');
        }
    }));
};

// 多个卡合并起来动态切换。
web.o.panel = function (cid) {

    return (cardjs.create({
        type: 'panel',
        cid: cid,
        pages: {
            '动态获取数据': [web.o.card_fetch],
            '多卡片混合': [web.o.card, web.o.card_ev, web.o.card_fetch]
        },
        style: {
            'tags': 'tags',
            'tag_normal': 'tag-normal',
            'tag_active': 'tag-active',
            'page': 'page',
            'card': 'card'
        }
    }));

};

web.o.card_fetch = function (container_id) {

    return(cardjs.create({
        cid: container_id,
        settings: {
            header: 'fetch',
            add_event: true
        },
        gen_html: function () {
            return '<div class="card-div" style="overflow:auto;">' +
                    '<input type="button" id="' + this.el(0) + '" value="serv.php" class="card-btn" style="float:left;">' +
                    '<div style="float:left;" id="' + this.el(1) + '">*需php支持*</div>' +
                    '</div>';
        },
        gen_ev_handler: function () {
            return ([function () {
                    this.f.fetch('checklogin', ['Amy', 'Adam'], function (data) {
                        //console.log(data);
                        this.el(1, true).innerHTML = cardjs.lib.html_escape(window.JSON.stringify(data));
                    });
                    //fd.destroy();
                }]);
        },
        add_event: function () {
            this.f.on('click', 0);
        }
    }));
};


web.o.cboard = function (container_id) {
    var cb = new cardjs.card(container_id);

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
                '    <td colspan="3" id="' + cb.el(18) + '" style="font-size:14px;padding-top:5px;">说明：</br>点击小方格开始游戏。</br>按钮上停1秒会有提示。</td>' +
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
            cb.el(i, true).value = chess[cb.board[i]];
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
        cb.el(18, true).innerHTML = html;
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
            cb.el(13, true).innerHTML = '<a href="' + url + '" download="Jhon.json">Jhon</a>';
        };
        evs[15] = function () {
            var url = cb.sam.save();
            cb.el(16, true).innerHTML = '<a href="' + url + '" download="Sam.json">Sam</a>';
        };
        evs[14] = function () {
            var file = cb.el(14, true).files[0];
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
            var file = cb.el(17, true).files[0];
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
            cb.el(19, true).setAttribute('class', 'cjs-btn-blue');
            cb.el(20, true).setAttribute('class', 'cjs-btn');

        };
        evs[20] = function () {
            cb.f.trigger(11);
            cb.com = cb.sam;
            console.log('Sam: online!');
            cb.el(20, true).setAttribute('class', 'cjs-btn-blue');
            cb.el(19, true).setAttribute('class', 'cjs-btn');
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
        cb.el(19, true).setAttribute('class', 'cjs-btn');
        cb.el(20, true).setAttribute('class', 'cjs-btn-blue');
    };

    return cb;
}
;
