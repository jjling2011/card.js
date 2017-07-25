/* global root, gvars, Lib */

// cardjs.card.f

var Funcs = {
    trigger: function (key) {
        //log(this);
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
        //log('param',params,'func',func);
        //log('fetch arguments:',arguments,'params:',params,'func:',func);


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
                    log('Fetch:func_ok not set! \n Server response:');
                }
                log(r);
            });
        }
        if (func.length === 1) {
            func.push(function (r) {
                var flag = verbose;
                if (flag) {
                    log('Fetch:func_fail not set! \n Server response:');
                }
                log(r);
            });
        }

        var xhr = new root.XMLHttpRequest();
        xhr.open('POST', this.settings.server_page);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        //log('fetch.this:',this);
        xhr.onload = function () {
            //log('fetch.onload.this:',this);
            if (xhr.status !== 200) {
                log('Fetch: Error code ' + xhr.status);
                return;
            }
            if (!(this.self)) {
                log('Fetch error: Object has been destroyed!');
                return;
            }
            var raw_rsp = xhr.responseText;
            if (verbose) {
                log('Fetch.raw:\n' + raw_rsp);
            }
            var rsp = root.JSON.parse(raw_rsp);
            if (rsp && rsp.tk) {
                //log('update token, rsp:',rsp);
                gvars.token = rsp.tk;
                Lib.cookie_set('tk', gvars.token);
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

        if (gvars.token === null) {
            gvars.token = Lib.cookie_get('tk');
        }
        //log('op/data/tk',op,param,token);
        xhr.send(encodeURI('tk=' + gvars.token + '&op=' + op + '&data=' + param));
    }
};