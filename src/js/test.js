/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* global CardJS */

//console.log(CardJS.Lib.rand());

// override CardJS.Card.settings
//CardJS.Lib.set({'serv_path':'hello.php'});


var web = {
    o: {}
};

web.o.page = function (cid) {
    var o = new CardJS.Page(cid, [web.o.card, web.o.card, web.o.card]);
    //console.log('page:',o);
    return o;
};

web.o.panel = function (cid) {
    var o = new CardJS.Panel(cid, {
        'P1': [web.o.card],
        'P2': [web.o.card, web.o.card],
        'P3': [web.o.card, web.o.card, web.o.card]
    }, {
        'tags': 'tags',
        'tag_normal': 'tag-normal',
        'tag_active': 'tag-active',
        'page': 'page',
        'card': 'card'
    });
    //console.log('panel:',panel);
    return o;
};

web.o.card = function (cid) {
    var o = new CardJS.Card(cid);
    o.f.merge({
        id_header: 'card',
        id_num: 2,
        add_event: true
    });
    //console.log(o);
    o.gen_html = function () {
        var html = '';
        html = '<input type="button" value="click me" id="' + o.ids[0] + '"><div id="' + o.ids[1] + '"></div>';
        return html;
    };

    o.gen_ev_handler = function () {
        var evs = [
            function () {
                //console.log('hello!');
                o.f.fetch('checklogin', ['Amy', 'Adam'], function (data) {
                    //console.log('func_success.this:',this);
                    console.log(data);
                    this.objs[1].innerHTML = window.JSON.stringify(data);
                    //fd.objs[1].innerHTML = eg.f.html_escape(JSON.stringify(data));
                });

            }
        ];
        return evs;
    };

    o.add_event = function () {
        //console.log('card add_event');
        o.f.on('click', 0);
    };
    
    o.after_add_event=function(){
        //console.log('card after_add_event');
        //o.f.off('click',0);
        //o.f.off('click',0);
    };
    //console.log('card:',o);
    return o;
};



