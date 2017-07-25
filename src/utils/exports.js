/* global Card, Set, Create, Lib */

var exports = {
    card: function(cid){
        var o=new Card({cid:cid});
        return o;
    },
    lib: Lib,
    set: Set,
    create: Create
};