/* global Card, Set, Create, Lib */

Create.card = function (cid) {
    var o = new Card({cid: cid});
    return o;
};

Create.lib = Lib;
Create.set = Set;

var exports = Create;

/*
 var exports = {
 card: function (cid) {
 var o = new Card({cid: cid});
 return o;
 },
 lib: Lib,
 set: Set,
 create: Create
 };
 */