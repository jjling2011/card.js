/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* global cardjs, Mustache */

//console.log(cardjs.lib.rand());

// override cardjs.card.settings
//cardjs.lib.set({'serv_path':'hello.php'});


var web = {
    o: {}
};

web.o.page = function (cid) {
    return cardjs.create({
        cid: cid,
        type: 'page',
        cards: [web.o.card, web.o.cdb, web.o.card]
    });
};

web.o.panel = function (cid) {
    return (cardjs.create({
        type: 'panel',
        cid: cid,
        pages: {
            'P1': [web.o.card],
            'P2': [web.o.cdb, web.o.card],
            'P3': [web.o.card, web.o.cdb, web.o.card]
        },
        style: {
            'tags': 'tags',
            'tag_normal': 'tag-normal',
            'tag_active': 'tag-active',
            'page': 'page',
            'card': 'card'
        }
    }));

};

web.o.card = function (cid) {
    return (cardjs.create({
        cid: cid,
        settings: {header: 'card', add_event: true},
        gen_html: function () {
            //return  '<input type="button" value="click me" id="' + o.elid('fetch') + '"><div id="' + o.elid('content') + '"></div>';
            var names = ['fetch', 'content'];
            this.ids = {};
            for (var i = 0; i < names.length; i++) {
                this.ids[names[i]] = this.el(names[i]);
            }

            var template = '<input type="button" value="click me" id="{{ids.fetch}}">' +
                    '<div id="{{ids.content}}" ></div>';
            return Mustache.render(template, this);
            //return html;
        },
        gen_ev_handler: function () {
            var evs = {
                'fetch': function () {
                    //console.log('hello!');
                    //console.log('fetch:',this);
                    this.f.fetch('checklogin', ['Amy', 'Adam'], function (data) {
                        //console.log('func_success.this:',this);
                        //console.log(data);
                        this.el('content', true).innerHTML = window.JSON.stringify(data);
                        //fd.objs[1].innerHTML = eg.f.html_escape(JSON.stringify(data));
                    });
                }
            };
            return evs;
        },
        add_event: function () {
            //console.log('card add_event');
            this.f.on('click', 'fetch');
        }
    }));
};

web.o.cdb = function (cid) {
    return(cardjs.create({
        cid: cid,
        settings: {header: 'card_db', key: 'null', add_event: true},
        gen_html: function () {
            var html = '';
            html += '<input type="button" value="save" id="' + this.el('save') + '">';
            html += '<input type="button" value="load" id="' + this.el('load') + '">';
            return html;
        },
        gen_ev_handler: function () {
            return ({
                'save':function(){
                    console.log('set data.');
                    this.f.save('hello!');
                },
                'load':function(){
                    console.log('got data:',this.f.load());
                }
            });
        },
        add_event: function () {
            this.f.on('click','save');
            this.f.on('click','load');
        }
    }));
};



