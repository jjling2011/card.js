
/* global Card, Lib */

var Panel = function (params) {
    //log('pages.type:', Lib.type(pages));
    var cid = params.cid,
            pages = params.pages,
            style = params.style;

    if (!(Lib.isString(cid) && Lib.type(pages) === 'Object')) {
        log('cid:', cid, ' pages:', pages, ' style:', style);
        throw new Error('Error: new Panel(cid,{name1:[card1, card2, ...],name2:[card, ...], ... )');
    }

    Card.call(this, params);



};

inherit(Panel, Card);

Panel.prototype.init = function (params) {
    var pages = params.pages;
    // style={'tags':css,'tag_active':css,'tag_normal':css,'page':css,'card':css};
    this.style = params.style || null;
    this.tags = Object.keys(pages);
    this.pages = pages;
    this.child = null;
    this.settings.header = 'panel';
    this.settings.add_event = true;
    bind_params(this, params, ['style', 'pages']);
};

// I really don't know why I like to set a name.
Panel.prototype.name = 'PANEL';

Panel.prototype.clean_up = function () {
    this.child && this.child.destroy();
    this.child = null;
};

Panel.prototype.gen_html = function () {
    var html = '<div ';
    if (this.style && this.style['tags']) {
        html += ' class="' + this.style['tags'] + '"';
    }
    html += '>';
    for (var i = 0; i < this.tags.length; i++) {
        html += '<input type="button" id="' + this.el(i) + '" value="' + this.tags[i] + '" >';
    }
    html += '</div><div id="' + this.el(i) + '" ';
    if (this.style && this.style['page']) {
        html += ' class="' + this.style['page'] + '"';
    }
    html += '></div>';
    return html;
};

Panel.prototype.gen_ev_handler = function () {
    var evs = [];
    //log('gen_ev_handler.this:',this);
    for (var i = 0; i < this.tags.length; i++) {
        (function () {
            var id = i;
            evs.push(function () {
                //log('panel_switch:',this);
                this.clean_up();
                if (this.style && this.style['tag_active'] && this.style['tag_normal']) {
                    for (var j = 0; j < this.tags.length; j++) {
                        //pn.objs[i].setAttribute('class',
                        this.el(j, true).setAttribute('class', this.style['tag_normal']);
                    }
                    this.el(id, true).setAttribute('class', this.style['tag_active']);
                }
                var page;
                var p = {
                    cid: this.el(this.tags.length),
                    cards: this.pages[this.tags[id]]
                };
                if (this.style && this.style['card']) {
                    p['style'] = {'card': this.style['card']};
                }
                page = new Page(p);
                this.child = page.show();
                page = null;
            });
        }());
    }
    //log('panel.gen_ev_handler:',evs);
    return evs;
};

Panel.prototype.add_event = function () {
    for (var i = 0; i < this.tags.length; i++) {
        this.f.on('click', i);
    }
};

Panel.prototype.after_add_event = function () {
    this.f.trigger(0);
};