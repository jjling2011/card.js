/* global root, Lib */

var Cache = (function () {
    var d = {};  // 缓存数据
    var e = {};  // 清除缓存的神奇字符串
    var f = {};  // event的神奇字符串和对应函数
    var r={
        event: function (ev, func, status) {
            /**
             * 如果 status=false 则 delete e[ev][this.settings.key]
             * 如果 func 是函数，添加到 f[ev].push({obj:this, func: func})
             * 如果 func 是 false ，则清理 f[ev][this,*]
             * @param {string} ev 事件名
             * @param {function} func 监听函数
             * @param {boolean} status 选项
             * @returns {boolean} 操作成功/失败(通常用不上)
             */

            var i, flag;

            f[ev] = f[ev] || [];
            if (Lib.isFunction(func)) {
                if (status === false) {
                    //delete func
                    flag = false;
                    //log('before delete:', f);
                    for (i = f[ev].length - 1; i >= 0; i--) {
                        if (f[ev][i].obj === this && f[ev][i].func === func) {
                            //log('match:', i);
                            f[ev].splice(i, 1);
                            flag = true;
                        }
                    }
                    //log('after delete func:', f);
                    return flag;
                }

                for (i = 0; i < f[ev].length; i++) {
                    if (f[ev][i].obj === this && f[ev][i].func === func) {
                        log('Function has already registed!', f);
                        return false;
                    }
                }

                this.cjsv.cevs[ev] = true; // 记录下事件名,在destroy时自动清理.
                f[ev].push({obj: this, func: func});
                //log('after regist new function:', f);
                return true;
            }

            if (func === false) {
                //delete ev listener
                flag = false;
                //log('before delete:', f);
                for (i = f[ev].length - 1; i >= 0; i--) {
                    if (f[ev][i].obj === this) {
                        //log('match:', i);
                        f[ev].splice(i, 1);
                        flag = true;
                    }
                }
                //log('after delete ev:', f);
                return flag;
            }

            // trigger event
            flag = true;
            var el;
            for (i = f[ev].length - 1; i >= 0; i--) {
                el = f[ev][i];
                if (el.obj && el.obj.self) {
                    //log('call func:',el);
                    el.func.bind(el.obj)(func);
                } else {
                    f[ev].splice(i, 1);
                    log('Error: object not exist， event listener deleted.');
                    flag = false;
                }
            }
            el = null;
            return flag;
        },
//        cc_debug: function () {
//            log('d:', d, ' e:', e);
//        },
        clear_cache: function (ev, status) {
            /**
             * 如果 status=undefined 触发ev定义的事件
             * 如果 status=true 添加 e[ev][this.settings.key]=true
             * 如果 status=false 则 delete e[ev][this.settings.key]
             * @param {string} ev 事件名
             * @param {boolean} status 选项
             * @returns {boolean} 操作成功/失败(通常用不上)
             */

            e[ev] = e[ev] || {};

            // delete event[key]
            if (status === false) {
                if ((ev in e) && (this.settings.key in e[ev])) {
                    delete e[ev][this.settings.key];
                    return true;
                }
                return false;
            }
            // add event[key]
            if (status === true) {
                //log('call: clear_cache(ev,key)', ev, key);
                //log(e[ev]);
                e[ev][this.settings.key] = true;
                //log('after add key:', e);
                return true;
            }
            //trigger event
            if (status === undefined) {
                if (ev in e) {
                    //log('call: clear_cache(ev)', ev);
                    for (var k in e[ev]) {
                        if (k in d) {
                            d[k] = null;
                        }
                    }
                    //log('after delete cache:\n', ' d:', d, '\ne:', e);
                    return true;
                }
            }
            throw new Error('Error: CardJS.Card.f.cc_cache(ev,status) ev:string status:true/false/undefined');
            return false;
        },
        cache: function (data, key) {
            //log('db:',this);
            if (key === undefined) {
                key = this.settings.key;
            }
            if (!Lib.isString(key)) {
                throw new Error('this.f.cache(data,key) key should be string.');
            }
            d[key] = data;
            key = null;
        },
        restore: function (key) {

            if (key !== undefined && (key in d)) {
                return (d[key]);
            }

            if (this.settings.key in d) {
                return (d[this.settings.key]);
            }

            return null;
        }
    };
    return (r);
}());