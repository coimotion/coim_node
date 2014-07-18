var  coim = require('./lib/coim'),
     PageEnty = require('./lib/entity/PageEnty'),
     Repo = require('./lib/entity/Repo');

coim.init();

coim.login('core/user/login', {accName: 'ben.lue@gocharm.com.tw', passwd: ''}, function(result) {
    if (result.errCode === 0)  {
        Repo.getRepo('ben_lue', function(err, myRepo) {
            if (err)
                console.log('Error as: %s', JSON.stringify(err));
            else
                play(myRepo);
        });
    }
    else
        console.log('Login result: [%d] %s', result.errCode, result.message);
},
function(err) {
    console.log('Oops! Failed to login.')
});


function  play(myRepo)  {
    myRepo.listEnties('myPage', function(err, data) {
        if (err)
            console.log('Error as: %s', JSON.stringify(err));
        else  {
            console.log('Total of %d pages.', data.list.length);
            for (var i in data.list)
                console.log(JSON.stringify(data.list[i], null, 4));
        }
    });
};

/*
var  repo = Repo.getRepo('ben_lue');
var  list = repo.listEnties('myPage');
*/
/*
var  pgEnty = new PageEnty({}, 'articles', {title: 'My Article', ngID: 3});
console.log('Name of the id is %s', pgEnty.getId());
*/
