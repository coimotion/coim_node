var  coim = require('./lib/coim'),
     PageEnty = require('./lib/entity/PageEnty'),
     Repo = require('./lib/entity/Repo');

coim.init();

coim.login('core/user/login', {accName: 'ben.lue@gocharm.com.tw', passwd: '000000'}, function(result) {
    console.log('Login result: [%d] %s', result.errCode, result.message);
},
function(err) {
    console.log('Oops! Failed to login.')
});

/*
Repo.getRepo('ben_lue', function(err, myRepo) {
    if (err)
        console.log('Error as: %s', JSON.stringify(myRepo));
    else
        console.log('Yes! Got the repository.');
});
*/
/*
var  pgEnty = new PageEnty({}, 'articles', {title: 'My Article', ngID: 3});
console.log('Name of the id is %s', pgEnty.getId());
*/
