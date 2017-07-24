/* global Lib, Card, root */

var Page = function (cid, cards, style) {
    // style={'cards':css_name,'card':css_name};
    if (!(Lib.isString(cid) && Lib.isArray(cards))) {
        log('cid:', cid, ' cards:', cards);
        throw new Error('Error: new Page(cid,[ card1, card2, ...] )');
    }

    Card.call(this, cid);
    this.style = style || null;
    this.cards = cards;
    this.settings.header = 'page';
    this.children = [];
};

inherit(Page, Card);

Page.prototype.name = 'PAGE';

Page.prototype.clean_up = function () {
    for (var key in this.children) {
        //log('page destroy:',this.children[key]);
        this.children[key] && this.children[key].destroy();
    }
    this.children = [];
};

Page.prototype.gen_html = function () {
    var html = '';

    for (var i = 0; i < this.cards.length; i++) {
        html += '<div id="' + this.el(i) + '" ';
        if (this.style && this.style['card']) {
            html += ' class="' + this.style['card'] + '" ';
        }
        html += '></div>';
    }
    return html;
};

Page.prototype.after_add_event = function () {
    this.clean_up();
    //log('page.this', this);
    
    function get_obj_from_string(str) {
        var obj = root;
        var s = str.split('.');
        for (var i = 0; i < s.length && obj !== undefined; i++) {
            obj = obj[s[i]];
        }
        return obj;
    }
    
    for (var i = 0; i < this.cards.length; i++) {
        this.children.push(get_obj_from_string(this.cards[i])(this.el(i)).show());
    }
};