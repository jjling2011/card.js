
/* global Card, Lib */

var Panel = function (cid, pages, style) {
    //log('pages.type:', Lib.type(pages));
    if (!(Lib.isString(cid) && Lib.type(pages) === 'Object')) {
        log('cid:', cid, ' pages:', pages, ' style:', style);
        throw new Error('Error: new Panel(cid,{name1:[card1, card2, ...],name2:[card, ...], ... )');
    }
    Card.call(this, cid);
    // style={'tags':css,'tag_active':css,'tag_normal':css,'page':css,'card':css};
    this.style = style || null;
    this.tags = Object.keys(pages);
    this.pages = pages;
    this.child = null;
    this.settings.header = 'panel';
    this.settings.add_event = true;
};

inherit(Panel, Card);

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
                if (this.style && this.style['card']) {
                    page = new Page(this.el(this.tags.length), this.pages[this.tags[id]], {'card': this.style['card']});
                } else {
                    page = new Page(this.el(this.tags.length), this.pages[this.tags[id]]);
                }
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