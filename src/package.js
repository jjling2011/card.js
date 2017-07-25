/* global gvars, Lib, funcs, Cache, call_method */

var Package = function (params) {

    this.self = true; // 兼容destroy()

    this.settings = {
        key: 'pkgshare'
    };

    Lib.expand(this.settings, gvars.settings, params.settings);

    this.cjsv = {
        // 登记 this.f.event()的时候记录下事件名.close的时候销毁事件.
        cevs: {}
    };

    this.f = {
        fetch: funcs.fetch.bind(this)
    };

    for (var k in Cache) {
        this.f[k] = Cache[k].bind(this);
    }

    bind_params(this, params, ['type']);
};

Package.prototype.destroy = function () {
    call_method.bind(this)('clean_up');
    var key;
    for (key in this.cjsv.cevs) {
        this.f.event(key, false);
        delete this.cjsv.cevs[key];
    }
    for (key in this.f) {
        this.f[key] = null;
        delete this.f[key];
    }
    for (key in this) {
        this[key] = null;
    }
    this.self = false;
};