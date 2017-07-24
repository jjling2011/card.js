
/* global Lib */

function Create(params) {

    if (!Lib.isObject(params)) {
        throw new Error('CardJS.Create({type:\'Card/Page/Panel\', settings:{header:\'card\', gen_html:function(){}, ...} });');
    }

    function bind_params(o, p) {
        var skip = {'cards': null, 'type': null, 'settings': null, 'pages': null, 'style': null};

        for (var key in p) {
            if (!(key in skip)) {
                if (Lib.isFunction(p[key])) {
                    o[key] = p[key].bind(o);
                } else {
                    o[key] = p[key];
                }
            }
        }
    }

    if (!('cid' in params)) {
        //throw new Error('CardJS.Create(params): params must have key cid');
        if (params.type === 'package') {
            var o = new Package(params);
            bind_params(o, params);
            if (Lib.isFunction(o.init)) {
                o.init.bind(o)();
            }
            return o;
        }
        return function (cid) {
            params.cid = cid;
            //log('params:', p);
            return Create(params);
        };
    }

    var o = null;
    var style = undefined;
    var cid = params['cid'];

    switch (params['type']) {
        case('page'):
            if (!('cards' in params)) {
                throw new Error('CardJS.Create(): page must contain cards.');
            }
            if ('style' in params) {
                style = params['style'];
            }
            o = new Page(cid, params['cards'], style);
            break;
        case('panel'):
            if (!('pages' in params)) {
                throw new Error('CardJS.Create(): page must contain pages.');
            }
            if ('style' in params) {
                style = params['style'];
            }
            o = new Panel(cid, params['pages'], style);
            break;
        default:
            o = new Card(cid);
            break;
    }

    if ('settings' in params) {
        Lib.expand(o.settings, params['settings']);
    }

    bind_params(o, params);

    style = null;
    params = null;

    return o;
}

