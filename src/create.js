
/* global Lib */

function Create(params) {

    if (!Lib.isObject(params)) {
        throw new Error('CardJS.Create({type:\'Card/Page/Panel\', settings:{header:\'card\', gen_html:function(){}, ...} });');
    }

    if (!('cid' in params) && (params.type !== 'package')) {
        var f = function (container_id) {
            params['cid'] = container_id;
            return Create(params);
        };
        return f;
    }

    var o = null;

    switch (params['type']) {
        case('package'):
            o = new Package(params);
            break;
        case('page'):
            o = new Page(params);
            break;
        case('panel'):
            o = new Panel(params);
            break;
        default:
            o = new Card(params);
    }

    return o;
}

