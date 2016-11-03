// GPL v3

/* global cardjs */

// 生成一个cardjs实例。
var eg = cardjs.cNew();

// 创建一个简单的卡片对象。
eg.o.simple_card = {
    cNew: function (container_id) {

        // 创建一个CARD实例。
        var scard = eg.CARD.cNew(container_id);

        // 生成界面代码
        scard.gen_html = function () {
            return '<div class="cjs-card-div">这是一个简单的卡片示例</div>';
        };

        // 生成实例后立即显示出来。  
        scard.show();
        return scard;
    }
};

// 创建一个包含事件的卡片对象。
eg.o.timer_card = {
    cNew: function (container_id) {
        var tcard = eg.CARD.cNew(container_id);

        //合并设置项
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

        // 显示当前时间
        tcard.update = function () {
            tcard.objs[2].innerHTML = (new Date()).toLocaleString();
        };

        // 生成处理事件的函数组
        tcard.gen_ev_handler = function () {
            tcard.ev_handler = [
                function () {
                    tcard.f.set_timer(tcard.update, 1000);
                },
                function () {
                    tcard.f.clear_timer();
                }
            ];
        };

        // 绑定事件(通过obj.f.on绑定的事件在重绘或删除时自动释放)
        tcard.add_event = function () {
            tcard.f.on('click', 0, 0);
            tcard.f.on('click', 1, 1);
        };

        tcard.show();
        return tcard;
    }
};

// 多个卡片合在一起动态切换。
eg.o.my_panel = {
    cNew: function (container_id) {
        var mp = eg.PANEL.cNew(container_id, [
            ['简单卡片', ['simple_card']],
            ['显示时间', ['timer_card']],
            ['多卡片混合', ['simple_card', 'timer_card', 'simple_card', 'timer_card']]
        ], 'cjs-pn-tag', 'cjs-pn-div');
        mp.show();
        mp.show_page(1);
        return mp;
    }
};

// 通过 xhr 动态获取数据。
eg.o.fetch_data = {
    cNew: function (container_id) {
        var fd = eg.CARD.cNew(container_id);
        fd.f.merge({
            id_num: 3,
            id_header: 'fetch',
            add_event: true
        });

        fd.gen_html = function () {
            return '<div class="cjs-card-div">' +
                    '<input type="button" id="' + fd.ids[0] + '" value="读取数据">' +
                    '<div id="' + fd.ids[1] + '"></div>' +
                    '</div>';
        };

        fd.gen_ev_handler = function () {
            fd.ev_handler = [
                function () {
                    // 默认从serv.php获取数据，可以通过 fd.settings.server_page指定。
                    // fd.f.fetch(函数名 ，参数，回调函数);
                    // 函数名：serv.php 中的函数名 写法详见 serv.php
                    // 参数：可以是字符串、数组 或 hash (注意serv.php中要做相应处理)
                    // 回调函数：参数data为json_object 
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