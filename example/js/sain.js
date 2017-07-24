/* 
 * LINCENSE: GPLv3
 * 
 * jjling2011 at gmail dot com 
 * 2016-11-12
 * 
 * 测试一些想法，暂未获得想要的结果。
 * 代码未整理，比较乱。
 * 
 */

var sain = {};

sain.f = {
    // 生成一个虚方法
    gen_virtual_method: function (method_name, id) {
        return function () {
            console.log(id + '.' + method_name + ': please rewrite this method!');
            return false;
        };
    },
    full: function (arr) {
        var c = 0;
        arr.forEach(function (e) {
            if (e === 0)
                c++;
        });
        return c === 0;
    },
    rand: function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    rpick: function (hash) {
        var keys = Object.keys(hash);
        return keys[sain.f.rand(0, keys.length - 1)];
    },
    clamp: function (val, min, max) {
        return Math.min(Math.max(val, min), max);
    },
    cutA: function (a, len) {
        len = len || 25;
        while (a.length > len) {
            a.pop();
        }
    },
    addA: function (a, el, len) {
        len = len || 25;
        a.unshift(el);
        sain.f.cutA(a, len);
    }
};

sain.UNIT = {
    cNew: function (network, id) {
        var u = {
            id: id,
            network: network
        };

        network.add_unit(u);
        return u;
    }
};

sain.SRC = {
    cNew: function (network, id) {
        var sr = sain.UNIT.cNew(network, id);

        sr.family = 'SRC';

        sr.output = {};

        sr.alarm = function (val) {
            // console.log('sensor:' + id + ' alarm:' + val);
            var flag = true;
            if (val in sr.output) {
                for (var key in sr.output[val]) {
                    flag = false;
                    network.wakeup(id, key, sr.family, val);
                }
            }
            if (flag) {
                network.on(id, val);
            }
            // console.log('on:' + flag);
        };

        sr.connect = function (target, val) {
            // console.log('sensor: ' + id + ' connect: ' + target + ' val: ' + val);
            if (!(val in sr.output)) {
                sr.output[val] = {};
            }
            sr.output[val][target] = true;
        };

        sr.disconnect = function (target, val) {
            // console.log('sensor: ' + id + ' disconnect: ' + target + ' val: ' + val);
            if ((val in sr.output) && (target in sr.output[val])) {
                delete sr.output[val][target];
            }
        };

        return sr;
    }
};

sain.COLLECTOR = {
    cNew: function (network, id) {
        var d = sain.UNIT.cNew(network, id);

        d.family = 'COLLECTOR';

        d.receive = function (source, val) {
            // console.log('collector:' + id + ' wakeup by: ' + source + ' val: ' + val);
            d.cache.push([source, val]);
        };

        d.fetch = function () {
            var r = null;
            if (d.cache.length > 0) {
                r = d.cache.pop();
                d.reset();
            }
            return r;
        };

        d.reset = function () {
            d.cache = [];
        };

        d.reset();
        return d;
    }
};

sain.SW = {
    cNew: function (network, id) {
        var sw = sain.UNIT.cNew(network, id);

        sw.family = 'SW';

        sw.output = {};
        sw.matrix = {SRC: {}, SW: {}};

        sw.merge_input = function () {
            if (Object.keys(sw.input.SRC) <= 0) {
                return sw.input.SW;
            }
            var ns = sain.SW.cNew(network, network.gen_id());
            for (var key in sw.input.SRC) {
                var val = sw.input.SRC[key];

                ns.matrix.SRC[key] = val;
                network.disconnect(key, sw.id, val);
                network.connect(key, ns.id, val);
                delete sw.matrix.SRC[key];
            }
            ns.connect(id);
            sw.matrix.SW[ns.id] = true;
            sw.input.SW[ns.id] = true;
            sw.input.SRC = {};
            // console.log('old unit/new switcher', sw, ns);
            return sw.input.SW;
        };

        sw.match = function () {
            var family = ['SRC', 'SW'];
            for (var i = 0; i < family.length; ++i) {
                for (var key in sw.matrix[family[i]]) {
                    if (!(key in sw.input[family[i]]) || sw.matrix[family[i]][key] !== sw.input[family[i]][key])
                        return false;
                }
            }
            return true;
        };

        sw.wakeup = function (source, family, val) {
            // console.log('switcher:' + id + ' wakeup by ' + family + '.' + source + ' val:' + val);

            network.partial_on(id);
            sw.input[family][source] = val;
            //console.log(rt.input);
            //console.log(rt.matrix);

            if (!sw.match()) {
                return;
            }

            network.partial_off(id);
            sw.reset();

            for (var u in sw.output) {
                network.wakeup(id, u, sw.family, true);
            }
        };

        sw.connect = function (target) {
            // console.log('switcher: ' + id + ' connect: ' + target);
            if (!(target in sw.output)) {
                sw.output[target] = true;
            }
        };

        sw.disconnect = function (target) {
            // console.log('switcher: ' + id + ' disconnect: ' + target);
            if (target in sw.output) {
                delete sw.output[target];
            }
        };

        sw.reset = function () {
            //console.log('id:' + id + ' reset.');
            sw.input = {SRC: {}, SW: {}};
        };

        sw.reset();
        return sw;
    }
};

sain.RT = {
    cNew: function (network, id) {
        var rt = sain.SW.cNew(network, id);

        rt.family = 'RT';
        rt.table = {};

        delete rt.connect;
        delete rt.disconnect;
        delete rt.output;

        rt.new_signal = function (sig) {
            rt.table[sig] = 0.55;
        };

        rt.gen_signal = function () {
            var max = null, val = 0, signal = null;
            var board = network.board.slice();
            for (var key in rt.table) {
                val = rt.table[key];
                board[key] = 2;
                if (max === null || val > max) {
                    max = val;
                    signal = key;
                }
            }
            // bug.mark 下面条件判断可能有问题 20161112 
//            if (max > 0 && max <= 0.101) {
//                return sain.f.rpick(rt.table);
//            }
            if (max === null || max < 0.5) {
                if (!sain.f.full(board)) {
                    var rsgn;
                    do {
                        rsgn = sain.f.rand(0, 8);
                    } while (board[rsgn]);
                    rt.new_signal(rsgn);
                    return rsgn;
                } else {
                    //console.log('no new signal!');
                }
            }
            return signal;
        };

        rt.wakeup = function (source, family, val) {
            // console.log('router:' + id + ' wakeup by ' + family + '.' + source + ' val:' + val);
            network.partial_on(id);
            rt.input[family][source] = val;
            //console.log(rt.input);
            //console.log(rt.matrix);
            if (!rt.match()) {
                return;
            }

            var signal = rt.gen_signal();
            if (signal !== null) {
                network.partial_off(id);
                rt.reset();
                network.sent(id, signal);
            } else {
                console.log(rt.table);
                throw 'router ' + id + ' : can not gen signal';
            }
        };

        return rt;
    }
};

sain.NETWORK = {
    cNew: function (name) {
        var nw = {};

        nw.name = name;

        nw.v = {
            last_id: 0,
            units: {},
            on_list: {},
            partial_on_list: {},
            srcs: [],
            cache: []
        };

        nw.s = {
            src_num: 9
        };

        nw.add_unit = function (u) {
            nw.v.units[u.id] = u;
        };

        nw.gen_id = function () {
            return ++(nw.v.last_id);
        };

        nw.get_last_id = function () {
            return (nw.v.last_id);
        };

        nw.partial_on = function (id) {
            // console.log('network partial_on:' + id);
            nw.v.partial_on_list[id] = true;
        };

        nw.partial_off = function (id) {
            // console.log('network partial_off:' + id);
            if (id in nw.v.partial_on_list) {
                delete nw.v.partial_on_list[id];
            }
        };

        nw.on = function (id, val) {
            nw.v.on_list[id] = val;
            //console.log('network on:' + name + ', val:' + value);
            //console.log(nw.active_list);
        };

        nw.off = function (id) {
            if (id in nw.v.on_list) {
                delete nw.v.on_list[id];
            }
            //console.log('network off:' + name);
            //console.log(nw.active_list);
        };

        nw.wakeup = function (source, target, family, val) {
            //console.log('nw.wakeup:',source,target,family,val);
            nw.v.units[target].wakeup(source, family, val);
        };

        nw.sent = function (source, signal) {
            nw.v.collector.receive(source, signal);
        };

        nw.process = function (data) {
            nw.board = data;
            // console.log('network processing:');
            // console.log(data);
//            for (var key in nw.v.units) {
//                nw.v.units[key].reset();
//            }

//            for (var key in nw.v.units) {
//                var family = nw.v.units[key].family;
//                if (family === 'SW' || family === 'RT') {
//                    if (Object.keys(nw.v.units[key].input.SRC).length > 0 || Object.keys(nw.v.units[key].input.SW).length > 0) {
//                        throw 'id:' + key + ' not reset!';
//                    }
//                }
//            }

            for (var i = 0; i < data.length; ++i) {
                nw.v.srcs[i].alarm(data[i]);
            }

            if (Object.keys(nw.v.on_list).length > 0) {
                nw.add_router();
                return(nw.process(data));
            }

            var r = nw.v.collector.fetch();
            if (r !== null) {
                //nw.v.cache.unshift(r);
                nw.v.cache.push(r);
                for (var c in nw.v.partial_on_list) {
                    nw.v.units[c].reset();
                }
                nw.v.partial_on_list = {};
                nw.v.on_list = {};
                return(r[1]);
            } else {
                // console.log('Error: no result!');
                nw.add_router();
                return(nw.process(data));
                //return(nw.connect(data));
            }
        };

        nw.feedback = function (r, strategy) {

            var flag, v;
            var dv, e, i;

            if (strategy === 'gentle') {
                //console.log('sam');
                flag = [0, 1, -1, 1][r];
                v = (r === 3) ? 0.007 : 0.01;
                dv = v * (1 / 6);
                for (i = nw.v.cache.length - 1; i >= 0; --i) {
                    e = nw.v.cache[i];
                    nw.v.units[e[0]].table[e[1]] += (flag * v);
                    v = (v > dv) ? (v - dv) : 0;
                }
            } else {
                //console.log('jhon');
                flag = [0, 1, -1, -1][r];
                v = (r === 3) ? 0.003 : 0.01;
                dv = v * (1 / 6);
                for (i = nw.v.cache.length - 1; i >= 0; --i) {
                    e = nw.v.cache[i];
                    nw.v.units[e[0]].table[e[1]] += (flag * v);
                    v = (v > dv) ? (v - dv) : 0;
                }
            }




            nw.reset();
        };

        nw.connect = function (source, target, val) {
            nw.v.units[source].connect(target, val);

        };
        nw.disconnect = function (source, target, val) {
            nw.v.units[source].disconnect(target, val);
        };

        nw.reset = function () {
            for (var c in nw.v.partial_on_list) {
                nw.v.units[c].reset();
            }
            nw.v.on_list = {};
            nw.v.partial_on_list = {};
            nw.v.collector.reset();
            nw.v.cache = [];
        };

        nw.add_router = function () {
            //console.log(nw.name,' on:', Object.keys(nw.v.on_list).length, ' partial:', Object.keys(nw.v.partial_on_list).length);
            var rt = sain.RT.cNew(nw, nw.gen_id());
            for (var key in nw.v.on_list) {
                var val = nw.v.on_list[key];
                nw.connect(key, rt.id, val);
                rt.matrix.SRC[key] = val;
            }
            for (var c in nw.v.partial_on_list) {
                var hash = nw.v.units[c].merge_input();
                for (var k in hash) {
                    nw.connect(k, rt.id);
                    rt.matrix.SW[k] = true;
                }
                nw.v.units[c].reset();
            }
            // console.log('new router: ', rt);
            nw.v.on_list = {};
            nw.v.partial_on_list = {};
            nw.v.collector.reset();
            //return(nw.process());
            //return null;
        };

        nw.init = function () {
            for (var i = 0; i < nw.s.src_num; ++i) {
                nw.v.srcs.push(sain.SRC.cNew(nw, nw.gen_id()));
            }
            nw.v.collector = sain.COLLECTOR.cNew(nw, nw.gen_id());
            return;
        };

        nw.load = function (data) {

            nw.reset();
            nw.v.units = {};
            nw.v.srcs = [];
            nw.v.last_id = 0;

            data.forEach(function (data) {
                switch (data.family) {
                    case 'COLLECTOR':
                        nw.v.collector = sain.COLLECTOR.cNew(nw, data.id);
                        break;
                    case 'SW':
                        var cell = sain.SW.cNew(nw, data.id);
                        cell.output = data.output;
                        cell.matrix = data.matrix;
                        break;
                    case 'RT':
                        var cell = sain.RT.cNew(nw, data.id);
                        cell.matrix = data.matrix;
                        cell.table = data.table;
                        break;
                    case 'SRC':
                        var cell = sain.SRC.cNew(nw, data.id);
                        cell.output = data.output;
                        nw.v.srcs.push(cell);
                        break;
                }
                if (nw.v.last_id < data.id) {
                    nw.v.last_id = data.id;
                }
            });
            console.log(nw.name + ': ' + nw.v.last_id + ' units loaded!');
        };

        nw.save = function () {
            var data = [];
            for (var id in nw.v.units) {
                var cell = nw.v.units[id];
                var d = {};
                d.id = cell.id;
                d.family = cell.family;
                switch (d.family) {
                    case 'COLLECTOR':
                        break;
                    case 'SW':
                        d.output = cell.output;
                        d.matrix = cell.matrix;
                        break;
                    case 'RT':
                        d.matrix = cell.matrix;
                        d.table = cell.table;
                        break;
                    case 'SRC':
                        d.output = cell.output;
                        break;
                }
                data.push(d);
            }
            var blob = new Blob([JSON.stringify(data)], {type: "application/json"});
            var url = window.URL.createObjectURL(blob);
            return url;
        };

        nw.init();
        return nw;
    }
};