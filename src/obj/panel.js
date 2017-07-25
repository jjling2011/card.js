/* global Paper, Lib */

var Panel = function (params) {

    var cid = params.cid,
            pages = params.pages,
            style = params.style;

    if (!(Lib.isString(cid) && Lib.type(pages) === 'Object')) {
        log('cid:', cid, ' pages:', pages, ' style:', style);
        throw new Error('Please check params!');
    }

    Paper.call(this, params);

    var pages = params.pages;

//    style={
//        'tags':css,
//        'tag_active':css,
//        'tag_normal':css,
//        'page':css,
//        'card':css
//    };

    this.style = params.style || null;
    this.tags = Object.keys(pages);
    this.pages = pages;
    this.child = null;
    this.settings.header = 'panel';
    this.settings.add_event = true;

    bind_params(this, params, ['style', 'pages']);

};

inherit(Panel, Paper);

Panel.prototype.name = 'PANEL';

Panel.prototype.clean_up = function () {
    this.child && this.child.destroy();
    this.child = null;
};

Panel.prototype.gen_html = function () {
    var html = '<div ';
    if (this.style && this.style.tags) {
        html += ' class="' + this.style.tags + '"';
    }
    html += '>';
    for (var i = 0; i < this.tags.length; i++) {
        html += '<input type="button" id="' + this.el(i)
                + '" value="' + this.tags[i] + '" >';
    }
    html += '</div><div id="' + this.el(i) + '" ';
    if (this.style && this.style.page) {
        html += ' class="' + this.style.page + '"';
    }
    html += '></div>';
    return html;
};

Panel.prototype.gen_ev_handler = function () {

    var evs = [];

    function change_style(id) {

        if (!this.style || !this.style.tag_active || !this.style.tag_normal) {
            return;
        }

        for (var i = 0; i < this.tags.length; i++) {
            this.el(i, true).setAttribute('class', this.style.tag_normal);
        }

        this.el(id, true).setAttribute('class', this.style.tag_active);
    }

    function clicked(id) {
        var f = function () {
            //log('panel_switch:',this);
            this.clean_up();

            change_style.bind(this)(id);

            var p = {
                cid: this.el(this.tags.length),
                cards: this.pages[this.tags[id]]
            };

            if (this.style && this.style.card) {
                p.style = {'card': this.style.card};
            }

            this.child = (new Page(p)).show();
        };
        return f;
    }

    for (var i = 0; i < this.tags.length; i++) {
        evs.push(clicked(i));
    }

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