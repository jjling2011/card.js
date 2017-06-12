/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* global CardJS, Mustache */

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
        header: 'card',
        add_event: true
    });
    
    o.gen_html = function () {
        //return  '<input type="button" value="click me" id="' + o.elid('fetch') + '"><div id="' + o.elid('content') + '"></div>';
        var names=['fetch','content'];
        o.ids={};
        for(var i=0;i<names.length;i++){
            o.ids[names[i]]=o.el(names[i]);
        }
        
        var template='<input type="button" value="click me" id="{{ids.fetch}}">'+
                '<div id="{{ids.content}}" ></div>';
        return Mustache.render(template,o);
        //return html;
    };

    o.gen_ev_handler = function () {
        var evs = {
            'fetch': function () {
                //console.log('hello!');
                o.f.fetch('checklogin', ['Amy', 'Adam'], function (data) {
                    //console.log('func_success.this:',this);
                    console.log(data);
                    this.el('content',true).innerHTML = window.JSON.stringify(data);
                    //fd.objs[1].innerHTML = eg.f.html_escape(JSON.stringify(data));
                });
            }
        };
        return evs;
    };

    o.add_event = function () {
        //console.log('card add_event');
        o.f.on('click', 'fetch');
    };

    o.after_add_event = function () {
        //console.log('card after_add_event');
        //o.f.off('click',0);
        //o.f.off('click',0);
    };
    //console.log('card:',o);
    return o;
};



