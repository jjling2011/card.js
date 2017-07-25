/* global Lib, Card, root */

//var Page = function (cid, cards, style) {
var Page = function (params) {
    // style={'cards':css_name,'card':css_name};
    var cid = params['cid'],
            cards = params.cards;

    if (!(Lib.isString(cid) && Lib.isArray(cards))) {
        // log('cid:', cid, ' cards:', cards);
        throw new Error('Error: new Page(cid,[ card1, card2, ...] )');
    }
    Card.call(this, params);

};

inherit(Page, Card);

Page.prototype.init = function (params) {
    this.style = params.style || null;
    this.cards = params.cards;
    this.settings.header = 'page';
    this.children = [];
    bind_params(this, params, ['style', 'cards']);
};

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
        var c = get_obj_from_string(this.cards[i]);
        var o = c(this.el(i));
        // log('str', this.cards[i], ' c', c, ' o', o);
        this.children.push(o.show());
    }
};