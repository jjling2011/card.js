/* global root, Lib */

var Cache = (function () {
    var d = {};  // 缓存数据
    var e = {};  // 清除缓存的神奇字符串
    
    var r = {

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