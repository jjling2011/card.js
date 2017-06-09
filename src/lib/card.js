(function (root, module_name) {

    module_name = module_name || 'Card';
    var console = root.console || {log: function () {}};

    function Card(container_id) {
        this.self = root.document.getElementById(container_id);
        this.settings = {
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
            // 显示debug信息 
            verbose: false
        };
        /* 
         * CARD内部使用的变量，设个奇怪的名包装起来不用占太多变量名。
         * fyi. cjsv = cardjs_variables
         */
        this.cjsv = {
            timer: {},
            evs: [],
            cid: container_id,
            loading_tip_timer: null,
            event_flag: false
        };
    }

    var funcs = {
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
        gen_objs: function (ids) {
            var rtv = new Array();
            for (var i = 0; i < ids.length; i++) {
                rtv.push(root.document.getElementById(ids[i]));
            }
            return (rtv);
        },
        gen_ids: (function () {
            var id_counter = 0;
            return (
                    function (head, num, len) {
                        len = len || 8;
                        var rid = head + '_' + id_counter + '_' + this.f('rand',len) + '_';
                        id_counter++;
                        var rtv = new Array();
                        for (var i = 0; i < num; ++i) {
                            rtv.push(rid + i);
                        }
                        //console.log(rtv);
                        return rtv;
                    });
        }.bind(this)()),
        on: function (event, obj_index, handler_index) {
            // 绑定事件
            if (!handler_index && handler_index !== 0) {
                handler_index = obj_index;
            }
            if (this.objs[obj_index].addEventListener) {
                this.objs[obj_index].addEventListener(event, this.ev_handler[handler_index], false);
            } else {
                //ie
                this.objs[obj_index].attachEvent("on" + event, this.ev_handler[handler_index]);
            }
            this.cjsv.evs[obj_index] = [event, handler_index];
        },
        off: function (event, obj_index, handler_index) {
            // 解绑事件
            if (!handler_index && handler_index !== 0) {
                handler_index = obj_index;
            }

            if (this.objs[obj_index].removeEventListener) {
                this.objs[obj_index].removeEventListener(event, this.ev_handler[handler_index], false);
            } else {
                //ie
                this.objs[obj_index].detachEvent("on" + event, this.ev_handler[handler_index]);
            }
            if (this.cjsv.evs[obj_index]) {
                delete this.cjsv.evs[obj_index];
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
            this.f('clear_timer',num);
            call_back();
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

            function type(obj) {
                return Object.prototype.toString.call(obj).slice(8, -1);
            }

            var i, params = [], func = [];
            for (i = 0; i < arguments.length; i++) {
                switch (type(arguments[i])) {
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


            if (params.length < 1 || type(params[0]) !== 'String') {
                console.log('error: cardjs.CARD.fetch()', 'parameters not match!');
                return;
            }

            var op, param = null, verbose = false;

            op = params[0];

            if (params.length > 1) {
                if (this.f('isString',params[1])) {
                    param = params[1];
                } else {
                    if (type(params[1]) === "Boolean" && params.length === 2) {
                        param = null;
                    } else {
                        param = root.JSON.stringify(params[1]);
                    }
                }
            }

            if (params.length > 1) {
                if (type(params[params.length - 1]) === "Boolean") {
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
            xhr.onload = function () {
                var that = this;
                if (xhr.status !== 200) {
                    console.log('Fetch: Error code ' + xhr.status);
                    return;
                }
                if (!(that.self)) {
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
                    func[0](rsp.data);
                } else {
                    // function fial
                    func[1](rsp.msg);
                }
            };
            xhr.send(encodeURI('op=' + op + '&data=' + param));
        }
    };

    Card.prototype.f = function () {
        if(arguments.length<1){return;}
        var args = [];
        Array.prototype.push.apply(args, arguments);
        var fn=args.shift();
        //console.log('fn:',fn,'arg:',args);
        //console.log();
        if(fn in funcs){
            return funcs[fn].apply(this,args);
            //console.log(this);
            //return rtv;
        }else{
            console.log('error: Card.funcs.'+fn+' not exist!');
        }
    };

    // 标识实例类型
    Card.prototype.name = 'CARD';


    Card.prototype.gen_html = function () {
        console.log('Card.prototype.gen_html(): Please rewrite this function.');
        return '';
    };

    // 自动释放通过 card.f.on 绑定的事件。后面的 remove_event 是手动。
    function release_event() {
        if (this.cjsv.evs.length > 0) {
            for (var key in this.cjsv.evs) {
                if (this.cjsv.evs[key]) {
                    this.f('off',this.cjsv.evs[key][0], key, this.cjsv.evs[key][1]);
                    delete this.cjsv.evs[key];
                }
            }
            this.cjsv.evs = [];
        }
    };

    // 如果card中有就调用，没有就显示一行debug信息。
    function call_method(fn, warn) {
        //console.log(this,fn,warn);
        if (fn in this) {
            this[fn]();
        } else {
            if (warn && this.settings.verbose) {
                console.log('Call undefine method: Card.prototype.funcs.' + fn + '()');
            }
        }
    }

    // 关键方法，生成、绑定、解绑事件，生成、显示界面，数据处理。
    Card.prototype.show = function () {
        var that = this;
        if (this.cjsv.event_flag) {
            call_method.bind(this)('remove_event', true);
            release_event.bind(this)();
            for (var key in this.cjsv.timer) {
                this.f('clear_timer',key);
            }
            that.cjsv.timer = {};
            this.cjsv.event_flag = false;
        }
        call_method.bind(this)('data_parser');
        if (this.settings.id_num >= 1) {
            this.ids = this.f('gen_ids',this.settings.id_header, this.settings.id_num);
        }
        this.self.innerHTML = this.gen_html();
        if (this.settings.id_num >= 1) {
            this.objs = this.f('gen_objs',this.ids);
        }
        call_method.bind(this)('before_add_event');
        if (this.settings.id_num >= 1 && this.settings.add_event) {
            call_method.bind(this)('gen_ev_handler', true);
            if (!this.cjsv.event_flag) {
                call_method.bind(this)('add_event', true);
                this.cjsv.event_flag = true;
            }
        }
        call_method.bind(this)('after_add_event');
        return this;
    };



    /* 
     * 销毁时进行一些清理工作。
     * 如果还有些其他要清理的东西可以写个
     * card.clean_up=function(){
     *   ... 你想清理的东西 ...
     * };
     */
    Card.prototype.destroy = function () {
        var that = this;
        if (this.cjsv.event_flag) {
            call_method.bind(this)('remove_event', true);
            release_event.bind(this)();
            this.cjsv.event_flag = false;
        }
        for (var key in this.cjsv.timer) {
            this.f('clear_timer',key);
        }
        that.cjsv.timer = {};
        call_method.bind(this)('clean_up');
        //this.cjsv.timer={};
        this.self = null;
    };


    root[module_name] = Card;
}(window));