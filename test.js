var  PageEnty = require('./lib/entity/PageEnty');

var  pgEnty = new PageEnty({}, 'articles', {title: 'My Article', ngID: 3});
console.log('Name of the id is %s', pgEnty.getId());
