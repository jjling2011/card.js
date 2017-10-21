/* global root, Lib */

var CjsEvent = (function () {
    var f = {};  // event的神奇字符串和对应函数
    var r = {
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
        }
    };
    return r;
}());