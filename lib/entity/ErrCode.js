/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */

exports.toMessage = function toMessage(code)  {
    var  msg;

    switch (code)  {
    case  exports.MASENTITY_NOT_ALLOWED:
        msg = 'Master entity is not allowed to run such a function.';
        break;

    case  exports.SUBENTITY_NOT_ALLOWED:
            msg = 'Sub-entity is not allowed to run such a function.';
            break;

    case  exports.NTYPE_FORMAT:
        msg = 'nType should be an integer and range between 1 ~ 5 or 10.';
        break;

    default:
        msg = 'Unknown error code';
    }

    return  msg;
};

exports.toError = function(code)  {
    return  {errCode: code, message: exports.toMessage(code)};
};


function  defineConstant(name, v)  {
	Object.defineProperty(exports, name, {
		value: v,
		enumerable: true
	});
};

defineConstant("MASENTITY_NOT_ALLOWED", 11010);
defineConstant("SUBENTITY_NOT_ALLOWED", 11011);
defineConstant("NTYPE_FORMAT", 11020);
