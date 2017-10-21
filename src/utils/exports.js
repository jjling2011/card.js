/* global Card, Setup, Create, Lib */

var exports = Create;

exports.card = function (cid) {
    var o = new Card({cid: cid});
    return o;
};

exports.lib = Lib;
exports.set = Setup;

