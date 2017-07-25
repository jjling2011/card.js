/* global gvars, Lib, Funcs, Cache, call_method, Event */

var Package = function (params) {

    // 配合this.f.fetch()
    this.self = true;

    this.settings = {
        key: 'pkgshare'
    };

    Lib.expand(this.settings, gvars.settings, params.settings);

    this.cjsv = {
        // 登记 this.f.event()的时候记录下事件名.close的时候销毁事件.
        cevs: {}
    };

    this.f = {
        fetch: Funcs.fetch.bind(this)
    };

    var d = [Cache, Event];
    for (var i = 0; i < d.length; i++) {
        for (var k in d[i]) {
            this.f[k] = d[i][k].bind(this);
        }
    }

    bind_params(this, params, ['type']);

    this.init();

};

Package.prototype.init = function () {
    // please redefine this function
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