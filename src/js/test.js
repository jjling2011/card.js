/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var web = {
    o: {}
};
web.o.card = function (cid) {
    var o = new Card(cid);
    o.f('merge' ,{
        id_header: 'card',
        id_num: 1,
        add_event:true
    });
    //console.log(o);
    o.gen_html = function () {
        var html = '';
        html = '<input type="button" value="click me" id="' + o.ids[0] + '">';
        return html;
    };
    
    o.gen_ev_handler=function(){
        o.ev_handler=[
            function(){
                console.log('hello!');
            }
        ];
    };
    
    o.add_event=function(){
        o.f('on','click',0);
    };
    //console.log(o);
    return o;
};



