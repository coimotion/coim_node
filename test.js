var  assert = require('assert'),
     coim = require('./lib/coim'),
     PageEnty = require('./lib/entity/PageEnty'),
     Repo = require('./lib/entity/Repo');

coim.init();


coim.login('core/user/login', {accName: 'ben.lue@gocharm.com.tw', passwd: '000000'}, function(result) {
    if (result.errCode === 0)  {
        Repo.getRepoAsync('ben_lue').then(function(myRepo) {
            testSuite(myRepo);
        }).catch(function(err) {
            console.log('Error as: %s', JSON.stringify(err));
        });
    }
    else
        console.log('Login result: [%d] %s', result.errCode, result.message);
},
function(err) {
    console.log('Oops! Failed to login.')
});


function  testSuite(myRepo)  {
    /*
    testRepoList(myRepo);
    testRepoFind(myRepo);
    testCreateDel(myRepo);
    testSavePage(myRepo);
    testSaveGeo(myRepo);
    */
    testPageGeoCreateDel(myRepo);
    testPageGeoInfo(myRepo);
    testPageGeoSave(myRepo);
};


function  testRepoList(myRepo)  {
    myRepo.listEntiesAsync('myPage').then(function(data) {
        assert.strictEqual( data.list.length, 4, 'Initial page counts should be 4.');
    }).catch( function(err) {dumpError('testRepoList', err)} );

    myRepo.listEntiesAsync('myGeo').then(function(data) {
        assert.strictEqual( data.list.length, 1, 'Initial geo counts should be 1.');
    }).catch( function(err) {dumpError('testRepoList', err)} );
};


function  testRepoFind(myRepo)  {
    var  ngID = 35026,
         geID = 33537;

    myRepo.findEntyAsync('myPage', ngID).then( function(page) {
        //console.log( JSON.stringify(page, null, 4) );
        assert.strictEqual( page.ngID, ngID, 'ngID is not correct.');
    }).catch( function(err) {dumpError('testRepoFind', err)} );

    myRepo.findEntyAsync('myPage', 26).then( function(page) {
        assert.equal( page, null, 'Should find nothing.');
    }).catch( function(err) {dumpError('testRepoFind', err)} );

    myRepo.findEntyAsync('myGeo', geID).then( function(geo) {
        assert.strictEqual( geo.geID, geID, 'geID is not correct.');
    }).catch( function(err) {dumpError('testRepoFind', err)} );
};


function  testCreateDel(myRepo)  {
    myRepo.createEntyAsync('myPage', {title: 'abc'})
    .then( function(page) {
        assert.strictEqual( page.title, 'abc', 'Page title is not correct.');
        return  page.ngID;
    })
    .then( function(ngID) {
        myRepo.findEntyAsync('myPage', ngID).then( function(page) {
            assert.strictEqual( page.ngID, ngID, 'ngID is not correct.');
            page.del();
        });
    })
    .catch( function(err) {dumpError('testCreateDel', err)} );
};


function  testSavePage(myRepo)  {
    var  ngID = 35026,
         oldTitle,
         newTitle = '123456';

    myRepo.findEntyAsync('myPage', ngID).then( function(page) {
        assert.strictEqual( page.ngID, ngID, 'ngID is not correct.');

        oldTitle = page.title;
        page.title = newTitle;

        page.saveAsync().then(function() {
            myRepo.findEntyAsync('myPage', ngID).then( function(page2) {
                assert.strictEqual( page2.title, newTitle, 'Page title is not updated.');

                page2.title = oldTitle;
                page2.save();
            });
        });
    })
    .catch( function(err) {dumpError('testSavePage', err)} );
};


function  testSaveGeo(myRepo)  {
    var  geID = 33537,
         oldAddr,
         newAddr = '123456';

    myRepo.findEntyAsync('myGeo', geID).then( function(geo) {
        assert.strictEqual( geo.geID, geID, 'geID is not correct.');

        oldAddr = geo.addr;
        geo.addr = newAddr;

        geo.saveAsync().then(function() {
            myRepo.findEntyAsync('myGeo', geID).then( function(geo2) {
                assert.strictEqual( geo2.addr, newAddr, 'Location address is not updated.');

                geo2.addr = oldAddr;
                geo2.save();
            });
        });
    })
    .catch( function(err) {dumpError('testSaveGeo', err)} );
};


function  testPageGeoCreateDel(myRepo)  {
    var  ngID = 35026,
         geData = {lat:25.334, lng:128.88 , addr: '123456 make it long'};

    myRepo.findEntyAsync('myPage', ngID).then( function(page) {
        page.addGeoAsync(geData).then( function(geo) {
            geo.delAsync();
        });
    })
    .catch( function(err) {dumpError('testPageGeoCreateDel', err)} );
};


function  testPageGeoInfo(myRepo)  {
    var  ngID = 35026,
         geID = 33546;

    myRepo.findEntyAsync('myPage', ngID).then( function(page) {
        page.findGeoAsync(geID).then( function(geo) {
            assert.equal( geo.latitude, 25.33, 'latitude is not correct.');
        });
    })
    .catch( function(err) {dumpError('testPageGeoInfo', err)} );
};


function  testPageGeoSave(myRepo)  {
    var  ngID = 35026,
         geID = 33546,
         oldAddr,
         newAddr = 'Where God lives';

    myRepo.findEntyAsync('myPage', ngID).then( function(page) {
        page.findGeoAsync(geID).then( function(geo) {
            oldAddr = geo.addr;
            geo.addr = newAddr;

            geo.saveAsync().then( function() {
                page.findGeoAsync(geID).then( function(geo2) {
                    assert.strictEqual(geo2.addr, newAddr, 'myPage.geo address has not be updated.');

                    geo2.addr = oldAddr;
                    geo2.saveAsync();
                });
            });
        });
    })
    .catch( function(err) {dumpError('testPageGeoSave', err)} );
};


function  dumpError(caseName, err)  {
    console.log('[%s]: %s', caseName, JSON.stringify(err, null, 4));
};
