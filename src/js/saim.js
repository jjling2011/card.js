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

var saim = {};

saim.f = {
    // 生成一个虚方法
    gen_virtual_method: function (method_name, msg) {
        return function () {
            console.log(method_name + msg + ': please rewrite this method!');
            return false;
        };
    },
    rand: function (min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
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
        saim.f.cutA(a, len);
    }
};

saim.CELL = {
    born: function (brain, name) {
        var c = {
            name: name,
            brain: brain
        };

        brain.cells[name] = c;
        return c;
    }
};

saim.SENSOR = {
    born: function (brain, name) {
        var sr = saim.CELL.born(brain, name);

        sr.family = 'SENSOR';

        sr.output = {};

        sr.alarm = function (val) {
            // console.log('sensor:' + name + ' alarm:' + val);
            var flag = true;
            if (sr.output[val]) {
                for (var key in sr.output[val]) {
                    flag = false;
                    brain.cells[key].wakeup(name, val);
                }
            }
            if (flag) {
                brain.on(name, val);
            }
            // console.log('on:' + flag);
        };

        sr.connect = function (target, val) {
            //console.log('sensor: ' + name + ' connect: ' + target);
            if (!(val in sr.output)) {
                sr.output[val] = {};
            }
            sr.output[val][target] = true;
        };

        sr.refresh = function () {};

        return sr;
    }
};

saim.COLLECTOR = {
    born: function (brain, name) {
        var clt = saim.CELL.born(brain, name);

        clt.family = 'COLLECTOR';

        clt.refresh = function () {
            clt.waker = null;
            clt.cache = {};
        };

        clt.wakeup = function (source, val) {
            //console.log('collector:' + name + ' wakeup by: ' + source + ' val: ' + val);
            clt.waker = source;
            clt.cache[source] = val;
        };

        clt.get = function () {
            //console.log('collector:' + name + ' getting data');
            if (clt.waker !== null) {
                var v = clt.cache[clt.waker];
                var k = clt.waker;
                if (v || v === 0) {
                    //console.log('success!');
                    clt.refresh();
                    return ([k, v]);
                }
            }
            //console.log('fail!');
            return false;
        };

        clt.refresh();
        return clt;
    }
};

saim.NERVE = {
    born: function (brain, name, gen) {
        var nv = saim.CELL.born(brain, name);

        nv.family = 'NERVE';

        nv.moves = {};
        if (gen) {
            nv.output = gen.output;
            nv.matrix = gen.matrix;
            nv.moves[gen.move] = 0.55;
        } else {
            nv.output = {};
            nv.matrix = {};
        }

        nv.get_best_action = function (input) {
            var max = 0, best_move = null, val = 0;
            for (var key in nv.moves) {
                val = nv.moves[key];
                if (val > max) {
                    max = val;
                    best_move = key;
                }
            }
            //console.log('max:' + max);
            if (max < 0.5) {
                //console.log('gen new move:');
                var taken = {};
                for (var key in input) {
                    if (input[key]) {
                        taken[key - 1] = true;
                    }
                }
                for (var key in nv.moves) {
                    taken[key] = true;
                }
                if (Object.keys(taken).length < 9) {
                    //console.log('(taken/input/moves/new_move)');
                    //console.log(taken);
                    //console.log(input);
                    //console.log(nv.moves);
                    var t = 0;
                    do {
                        t = Math.floor(Math.random() * 9);
                    } while (t in taken);
                    if (t || t === 0) {
                        nv.moves[t] = 0.55;
                        nv.output[t] = {};
                        for (var key in nv.output[best_move]) {
                            nv.output[t][key] = nv.output[best_move][key];
                        }
                        //console.log(nv.moves);
                        return t;
                    }
                } else {
                    console.log('Error: no new move.');
                    if (max <= 0.1) {
                        var ks = Object.keys(nv.moves);
                        best_move = ks[saim.f.rand(0, ks.length)];
                        // console.log(nv.moves);
                    }

                }
            }
            return best_move;
        };

        nv.wakeup = function (source, val) {
            //console.log('nerve:' + name + ' wakeup by: ' + source + ' val: ' + val);

            brain.half_on(name);

            nv.input[source] = val;
            //console.log(nv.input);
            //console.log(nv.matrix);

            for (var key in nv.matrix) {
                if (!(key in nv.input) || nv.matrix[key] !== nv.input[key]) {
                    //console.log('nv.input !== nv.matrix by key: '+key);
                    return;
                }
            }

            var idx = nv.get_best_action(nv.input);

            var flag = true;

            if (idx !== null && nv.output[idx]) {
                for (var key in nv.output[idx]) {
                    brain.cells[key].wakeup(name, idx);
                    flag = false;
                }
                nv.refresh();
            }

            if (flag) {
                brain.on(name, idx);
            }
            //console.log('best_move: ' + idx + ' on: ' + flag);
        };

        nv.refresh = function () {
            //console.log('nerve:' + name + ' sleep.');
            brain.half_off(name);
            nv.input = {};
        };

        nv.connect = function (target, val) {
            console.log('nerve: ' + name + ' connect: ' + target + ' val: ' + val);
            if (!(val in nv.output)) {
                nv.output[val] = {};
            }
            nv.output[val][target] = true;
        };

        nv.refresh();
        return nv;
    }
};

saim.BRAIN = {
    born: function (restore_data) {
        var br = {
            child_id: 0,
            cells: {},
            active_list: {},
            half_list: {},
            sensors: [],
            history: [],
            record: [0, 0, 0]
        };

        br.settings = {
            senses: 9
        };

        br.half_on = function (name) {
            //console.log('brain half_on:' + name);
            br.half_list[name] = true;
        };

        br.half_off = function (name) {
            //console.log('brain half_off:' + name);
            if (name in br.half_list) {
                delete br.half_list.name;
            }
        };

        br.on = function (name, value) {
            br.active_list[name] = value;
            //console.log('brain on:' + name + ', val:' + value);
            //console.log(br.active_list);
        };

        br.off = function (name) {
            if (br.active_list[name]) {
                delete br.active_list[name];
            }
            //console.log('brain off:' + name);
            //console.log(br.active_list);
        };

        br.process = function (data) {
            // console.log('brain processing:');
            // console.log(data);
            for (var key in br.cells) {
                br.cells[key].refresh();
            }
            for (var i = 0; i < data.length; ++i) {
                br.sensors[i].alarm(data[i]);
            }

            if (Object.keys(br.active_list).length > 0) {
                return(br.connect(data));
            }

            var r = br.collector.get();
            if (r) {
                //console.log('get result: [ ' + r + ' ]');
                br.history.unshift(r);
                return(r[1]);
            } else {
                return(br.connect(data));
            }
        };

        br.feedback = function (r) {

            var flag = [-1, -1, 1][r % 3];
            if (flag === 0) {
                return;
            }

            var v = r ? 0.3 : 0.15;
            var dv = v * (1 / 5);

            for (var i = 0; i < br.history.length; ++i) {
                var e = br.history[i];
                var val = br.cells[e[0]].moves[e[1]];

                br.cells[e[0]].moves[e[1]] = saim.f.clamp(val + (flag * v), 0.1, 0.9);
                v = saim.f.clamp(v - dv, 0, 1);
                //console.log('cell ' + e[0] + ' moves:');
                //console.log(br.cells[e[0]].moves);
            }

            br.history = [];
        };

        br.next_move = function (data) {
            var idx;
            for (idx = 0; idx < br.settings.senses; ++idx) {
                if (data[idx] === 0)
                    break;
            }
            if (idx >= br.settings.senses) {
                idx = false;
            }
            return idx;
        };

        br.connect = function (data) {
            // console.log('brain connect:');
            // console.log(data);
            //console.log(br.active_list);

            var gen = {
                matrix: {},
                output: {},
                move: br.next_move(data)
            };

            if (gen.move === false) {
                console.log('error: game over!');
                return false;
            }
            //console.log('active_list/cache:');
            //console.log(br.active_list);
            //console.log(br.collector.cache);
            for (var key in br.active_list) {
                gen.matrix[key] = br.active_list[key];
            }

            for (var key in br.collector.cache) {
                gen.matrix[key] = br.collector.cache[key];
            }

            //console.log('half_list: ');
            //console.log(br.half_list);
            for (var nv in br.half_list) {
                var cell = br.cells[nv];
                //console.log('half_list of cell: '+nv);
                //console.log(cell.input);
                for (var key in cell.input) {
                    gen.matrix[key] = cell.input[key];
                }
            }
            // console.log(setting);
            var clt_name = br.collector.name;
            gen.output[gen.move] = {};
            gen.output[gen.move][clt_name] = true;

            var nerve = saim.NERVE.born(br, ++br.child_id, gen);

            // console.log('new nerve: ' + nerve.name);
            //console.log(nerve);

            for (var key in gen.matrix) {
                br.cells[key].connect(nerve.name, gen.matrix[key]);
            }

            br.active_list = {};
            br.half_list = {};
            return(br.process(data));
        };

        br.report = function () {
            console.log('brain report:');
            console.log(br);
        };

        br.init = function () {
            if (!restore_data) {
                for (var i = 0; i < br.settings.senses; ++i) {
                    br.sensors.push(saim.SENSOR.born(br, ++br.child_id));
                }
                br.collector = saim.COLLECTOR.born(br, ++br.child_id);
                return;
            }
            restore_data.forEach(function (data) {
                switch (data.family) {
                    case 'COLLECTOR':
                        br.collector = saim.COLLECTOR.born(br, data.name);
                        break;
                    case 'NERVE':
                        var cell = saim.NERVE.born(br, data.name);
                        cell.output = data.output;
                        cell.matrix = data.matrix;
                        cell.moves = data.moves;
                        break;
                    case 'SENSOR':
                        var cell = saim.SENSOR.born(br, data.name);
                        cell.output = data.output;
                        br.sensors.push(cell);
                        break;
                }
                if (br.child_id < data.name) {
                    br.child_id = data.name;
                }
            });
        };

        br.snap_shot = function () {
            var data = [];
            for (var key in br.cells) {
                var cell = br.cells[key];
                var d = {};
                d.name = cell.name;
                d.family = cell.family;
                switch (d.family) {
                    case 'COLLECTOR':
                        break;
                    case 'NERVE':
                        d.output = cell.output;
                        d.matrix = cell.matrix;
                        d.moves = cell.moves;
                        break;
                    case 'SENSOR':
                        d.output = cell.output;
                        break;
                }
                data.push(d);
            }
            var blob = new Blob([JSON.stringify(data)], {type: "application/json"});
            var url = window.URL.createObjectURL(blob);
            return url;
        };

        br.init();
        return br;
    }
};