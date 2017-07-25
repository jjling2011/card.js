/* global root, gvars, Cache, Lib, call_method, release_event, funcs, bind_params */

// card对象

var Card = function (params) {
    
    this.construct(params);
    this.init(params);
    
};

/**
 * 每个派生对象都需要重写此方法
 * 里面是该对象特有的初始化代码
 */
Card.prototype.init=function(params){
    bind_params(this, params);
};

Card.prototype.construct = function (params) {

    var container_id = params.cid;

    this.self = root.document.getElementById(container_id);

    this.settings = {
        // 服务页面url
        server_page: 'serv.php',
        key: 'share',
        // 自动生成的id以什么开头（方便调试）
        header: 'card',
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
        evs: [], // this.f.on 绑定的事件
        ev_handler: {}, // 事件响应函数
        cevs: {}, // this.f.event 登记的事件
        ids: {},
        objs: {}, // cache
        cid: container_id,
        rendered: false,
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

/**
 * 如果 key = undefine 返回当前id数量.
 * 如果 obj = undefine 返回string类型的id.
 * 如果 obj = true 返回 key 对应的 DOM object.
 * 
 * @param {null/num/string} key 
 * @param {boolean} obj
 * @returns {num/string/DOM object}
 */
Card.prototype.el = function (key, obj) {
    // Card.el() return current elements number;
    if (key === undefined) {
        return Object.keys(this.cjsv.ids).length;
    }
    // Card.el('name') return { id: header_name_GlobalCounter_randstr, obj: documnet.getElementById(id)};
    if (obj === undefined) {
        var id;
        if (!(key in this.cjsv.ids)) {
            id = this.settings.header + '_' + key + '_' + (gvars.cur_serial_id++) + '_' + Lib.rand(8);
            this.cjsv.ids[key] = id;
        } else {
            id = this.cjsv.ids[key];
        }
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

Card.prototype.show = function () {
    if (!this.cjsv.rendered) {
        return this.refresh();
    }
    return this;
};

Card.prototype.refresh = function () {
    //render.bind(this)();
    if (this.cjsv.event_flag) {
        call_method.bind(this)('remove_event', true);
        release_event.bind(this)();
        this.cjsv.event_flag = false;
    }

    for (var key in this.cjsv.ids) {
        if (this.cjsv.objs[key]) {
            this.cjsv.objs[key] = null;
            delete this.cjsv.objs[key];
        }
        delete this.cjsv.ids[key];
    }

    call_method.bind(this)('data_parser');
    this.self.innerHTML = this.gen_html();
    call_method.bind(this)('before_add_event');
    if (this.el() > 0 && this.settings.add_event) {
        var evh = call_method.bind(this)('gen_ev_handler', true);

        if (!(Lib.isArray(evh) || Lib.isObject(evh))) {
            throw new Error('Card.cjsv.ev_handler should be [func1(), ... ] or { name1:func1(), ... }');
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

    this.cjsv.rendered = true;
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

    if (this.cjsv.event_flag) {
        call_method.bind(this)('remove_event', true);
        release_event.bind(this)();
        this.cjsv.event_flag = false;
    }

    for (var key in this.cjsv.cevs) {
        this.f.event(key, false);
        delete this.cjsv.cevs[key];
    }

    call_method.bind(this)('clean_up');
    //this.cjsv.timer={};
    for (var key in this.cjsv.ids) {
        if (this.cjsv.objs[key]) {
            //this.cjsv.objs[key] = null;
            delete this.cjsv.objs[key];
        }
        delete this.cjsv.ids[key];
    }

    for (var key in this.f) {
        delete this.f[key];
    }
    for (var key in this) {
        this[key] = null;
    }
};

// 我真的不知道为什么我喜欢给他设个根本用不上的名字 ...
Card.prototype.name = 'CARD';

Card.prototype.gen_html = function () {
    throw new Error('Card.prototype.gen_html(): Please rewrite this function.');
    return '';
};


