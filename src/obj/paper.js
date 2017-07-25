/* global root, gvars, Cache, Lib, call_method, funcs, bind_params */

// card对象的你对象

var Paper = function (params) {

    var cid = params.cid;

    this.self = root.document.getElementById(cid);

    this.settings = {

        // 服务页面url
        server_page: 'serv.php',

        // 缓存/共亨数据时使用的神奇字符串
        key: 'share',

        // 自动生成的id首字符串（方便调试）
        header: 'card',

        // 是否需要绑定事件
        add_event: false,

        // 显示debug信息 
        verbose: false
    };

    // CARD内部使用的变量，设个奇怪的名包装起来不用占太多变量名。
    // fyi. cjsv = cardjs_variables
    this.cjsv = {
        timer: {},
        evs: [], // this.f.on 绑定的事件
        ev_handler: {}, // 事件响应函数
        cevs: {}, // this.f.event 登记的事件
        ids: {},
        objs: {}, // cache
        cid: cid,
        event_flag: false
    };

    Lib.expand(this.settings, gvars.settings, params.settings);

    this.f = {};

    var key;

    for (key in funcs) {
        this.f[key] = funcs[key].bind(this);
    }

    for (key in Cache) {
        this.f[key] = Cache[key].bind(this);
    }

    key = null;

};

// 我真的不知道为什么我喜欢给他设个根本用不上的名字 ...
Paper.prototype.name = 'Paper';

/**
 * 如果 key = undefine 返回当前id数量.
 * 如果 obj = undefine 返回string类型的id.
 * 如果 obj = true 返回 key 对应的 DOM object.
 * 
 * @param {null/num/string} key 
 * @param {boolean} obj
 * @returns {num/string/DOM object}
 */
Paper.prototype.el = function (key, obj) {

    if (key === undefined) {
        return Object.keys(this.cjsv.ids).length;
    }

    if (obj === undefined) {

        if (key in this.cjsv.ids) {
            return (this.cjsv.ids[key]);
        }

        var id = [
            this.settings.header,
            key,
            (gvars.cur_serial_id)++,
            Lib.rand(8)
        ].join('_');

        this.cjsv.ids[key] = id;

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

Paper.prototype.__clean = function (everything) {
    var key;
    if (this.cjsv.event_flag) {
        call_method.bind(this)('remove_event', true);

        for (key in this.cjsv.timer) {
            this.f.clear_timer(key);
        }

        if (this.cjsv.evs.length > 0) {
            //log('before release_event:', this.cjsv.evs);
            var e = this.cjsv.evs;
            for (key in e) {
                e[key] && this.f.off(e[key][0], e[key][1], e[key][2]);
                delete e[key];
            }
            //log('after release_event:', this.cjsv.evs);
            e = null;

        }
        this.cjsv.evs = [];
        for (key in this.cjsv.ev_handler) {
            delete this.cjsv.ev_handler[key];
        }

        this.cjsv.event_flag = false;
    }

    for (key in this.cjsv.cevs) {
        this.f.event(key, false);
        delete this.cjsv.cevs[key];
    }

    if (everything) {
        call_method.bind(this)('clean_up');
    }

    //this.cjsv.timer={};
    for (key in this.cjsv.ids) {
        if (this.cjsv.objs[key]) {
            //this.cjsv.objs[key] = null;
            delete this.cjsv.objs[key];
        }
        delete this.cjsv.ids[key];
    }
};

Paper.prototype.show = function () {

    this.__clean(false);

    call_method.bind(this)('data_parser');
    this.self.innerHTML = this.gen_html();
    call_method.bind(this)('before_add_event');
    if (this.el() > 0 && this.settings.add_event) {
        var evh = call_method.bind(this)('gen_ev_handler', true);

        if (!(Lib.isArray(evh) || Lib.isObject(evh))) {
            throw new Error('gen_ev_handler should return func_arr or func_dict.');
        }

        for (var key in evh) {
            this.cjsv.ev_handler[key] = evh[key].bind(this);
        }

        evh = null;

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
Paper.prototype.destroy = function () {

    this.__clean(true);

    for (var key in this.f) {
        delete this.f[key];
    }
    for (var key in this) {
        this[key] = null;
    }
};

Paper.prototype.gen_html = function () {
    throw new Error('gen_html() must be redefined!');
    return '';
};


