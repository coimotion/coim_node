var  assert = require('assert'),
     coim = require('./lib/coim');

coim.init();


coim.login('core/user/login', {accName: 'ben.lue@gocharm.com.tw', passwd: '000000'}, function(result) {
    if (result.errCode === 0)  {
        coim.getRepo('ben_lue', function(err, myRepo) {
            if (err)
                console.log('Error as: %s', JSON.stringify(err));
            else
                testSuite(myRepo);
        });
    }
    else
        console.log('Login result: [%d] %s', result.errCode, result.message);
},
function(err) {
    console.log('Oops! Failed to login.')
});


function  testSuite(myRepo)  {
    testRepoList(myRepo);
    testRepoFind(myRepo);
    /*
    testCreateDel(myRepo);
    testSavePage(myRepo);
    testSaveGeo(myRepo);
    testPageAttach(myRepo);
    testPageGeoList(myRepo);
    testPageTag(myRepo);
    testGeoPageList(myRepo);
    testGeoTag(myRepo);

    testPageGeoCreateDel(myRepo);
    testPageGeoInfo(myRepo);
    testPageGeoSave(myRepo);
    testPageGeoTag(myRepo);

    testGeoPageCreateDel(myRepo);
    testGeoPageInfo(myRepo);
    testGeoPageSave(myRepo);
    testGeoPageTag(myRepo);
    testGeoPageListAux(myRepo);
    */
    // conflicts: due to async execution, the following test cases would conflict with others
    //testPageListAux(myRepo);        // this test case conflicts with thisPageAttach();
    //testGeoPageAttach(myRepo);    // this test case conflicts with testGeoPageListAux();
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


function  testPageListAux(myRepo)  {
    var  ngID = 35026;

    myRepo.findEntyAsync('myPage', ngID).then( function(page) {
        page.listAuxAsync(1).then( function(rtnData) {
            assert.strictEqual( rtnData.iconURI, "ng35026/cn25086.jpeg", 'Icon path.');

            page.listAuxAsync(2).then( function(rtnData) {
                assert.strictEqual( rtnData.list.length, 0, 'No attachment file.');
            });
        });
    })
    .catch( function(err) {dumpError('testPageListAux', err)} );
};


function  testPageAttach(myRepo)  {
    var  ngID = 35026,
         file = '/Users/ben/Downloads/htmlBlock/css/photo/02.jpg';

    myRepo.findEntyAsync('myPage', ngID).then( function(page) {
        page.attachAsync({title: 'page attachment', nType:2}, [file]).then( function(rtnData) {
            var  cnID = rtnData.value.id;
            page.detachAsync(cnID).then( function(rtnData) {
                page.listAuxAsync(2).then( function(rtnData) {
                    assert.strictEqual( rtnData.list.length, 0, 'No attachment file.');
                });
            });
        });
    })
    .catch( function(err) {dumpError('testPageAttach', err)} );
};


function  testPageTag(myRepo)  {
    var  ngID = 35026,
         tag = ['SaaS', '後端服務'];

    myRepo.findEntyAsync('myPage', ngID).then( function(page) {
        page.tagAsync(tag).then( function(rtnData) {
            myRepo.apiAsync('myPage/view/' + ngID, {tag: 3}).then( function(rtnData) {
                assert.strictEqual( rtnData.tags.length, 2, 'There are two tags of this page.');
                page.untagAsync(tag);
            });
        });
    })
    .catch( function(err) {dumpError('testPageTag', err)} );
};


function  testGeoTag(myRepo)  {
    var  geID = 33537,
         tag = ['COIMOTION', '後端服務'];

    myRepo.findEntyAsync('myGeo', geID).then( function(geo) {
        geo.tagAsync(tag).then( function(rtnData) {
            myRepo.apiAsync('myGeo/info/' + geID, {tag: 3}).then( function(rtnData) {
                assert.strictEqual( rtnData.tags.length, 2, 'There are two tags of this location.');
                geo.untagAsync(tag);
            });
        });
    })
    .catch( function(err) {dumpError('testGeoTag', err)} );
};


function  testGeoPageTag(myRepo)  {
    var  ngID = 35118,
         geID = 33537,
         tag = ['SaaS', '後端服務'];

    myRepo.findEntyAsync('myGeo', geID).then( function(geo) {
        geo.findPageAsync(ngID).then( function(page) {
            page.tagAsync(tag).then( function(rtnData) {
                myRepo.apiAsync('myGeo.page/view/' + geID + '.' + ngID, {tag: 3}).then( function(rtnData) {
                    assert.strictEqual( rtnData.tags.length, 2, 'There are two tags of this page.');
                    page.untagAsync(tag);
                });
            });
        });
    })
    .catch( function(err) {dumpError('testGeoPageTag', err)} );
};


function  testPageGeoList(myRepo)  {
    var  ngID = 35026;

    myRepo.findEntyAsync('myPage', ngID).then( function(page) {
        page.listGeoAsync({}).then( function(rtnData) {
            assert.strictEqual( rtnData.list.length, 2, 'The test page has two locations.');
        });
    })
    .catch( function(err) {dumpError('testPageGeoList', err)} );
};


function  testPageGeoTag(myRepo)  {
    var  ngID = 35026,
         geID = 33546,
         tag = ['COIMOTION', '後端服務'];

    myRepo.findEntyAsync('myPage', ngID).then( function(page) {
        page.findGeoAsync(geID).then( function(geo) {
            geo.tagAsync(tag).then( function(rtnData) {
                myRepo.apiAsync('myPage.geoLoc/info/' + ngID + '.' + geID, {tag: 3}).then( function(rtnData) {
                    assert.strictEqual( rtnData.tags.length, 2, 'There are two tags of this location.');
                    geo.untagAsync(tag);
                });
            });
        });
    })
    .catch( function(err) {dumpError('testPageGeoTag', err)} );
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
                    assert.strictEqual(geo2.addr, newAddr, 'myPage.geo address has not been updated.');

                    geo2.addr = oldAddr;
                    geo2.saveAsync();
                });
            });
        });
    })
    .catch( function(err) {dumpError('testPageGeoSave', err)} );
};


function  testGeoPageCreateDel(myRepo)  {
    var  geID = 33537,
         ngData = {title: '測試中文標題'};

    myRepo.findEntyAsync('myGeo', geID).then( function(geo) {
        geo.createPageAsync(ngData).then( function(page) {
            page.delAsync();
        });
    })
    .catch( function(err) {dumpError('testGeoPageCreateDel', err)} );
};


function  testGeoPageInfo(myRepo)  {
    var  ngID = 35118,
         geID = 33537;

    myRepo.findEntyAsync('myGeo', geID).then( function(geo) {
        geo.findPageAsync(ngID).then( function(page) {
            assert.equal( page.title, '測試中文標題', 'Page title is not correct.');
        });
    })
    .catch( function(err) {dumpError('testGeoPageInfo', err)} );
};


function  testGeoPageSave(myRepo)  {
    var  ngID = 35118,
         geID = 33537,
         oldTitle,
         newTitle = 'Tempt title';

    myRepo.findEntyAsync('myGeo', geID).then( function(geo) {
        geo.findPageAsync(ngID).then( function(page) {
            oldTitle = page.title;
            page.title = newTitle;

            page.saveAsync().then( function() {
                geo.findPageAsync(ngID).then( function(page2) {
                    assert.strictEqual(page2.title, newTitle, 'myGeo.page title has not been updated.');

                    page2.title = oldTitle;
                    page2.saveAsync();
                });
            });
        });
    })
    .catch( function(err) {dumpError('testGeoPageSave', err)} );
};


function  testGeoPageList(myRepo)  {
    var  geID = 33537;

    myRepo.findEntyAsync('myGeo', geID).then( function(geo) {
        geo.listPagesAsync({}).then( function(rtnData) {
            assert.strictEqual(rtnData.list.length, 1, 'Page count is 1.');
            assert.strictEqual(rtnData.list[0].title, '測試中文標題', 'Page title');
        });
    })
    .catch( function(err) {dumpError('testGeoPageList', err)} );
};


function  testGeoPageListAux(myRepo)  {
    var  ngID = 35118,
         geID = 33537;

    myRepo.findEntyAsync('myGeo', geID).then( function(geo) {
        geo.findPageAsync(ngID).then( function(page) {
            page.listAuxAsync(1).then( function(rtnData) {
                // the return object is empty.
                //assert.strictEqual( rtnData.iconURI, "ng35026/cn25086.jpeg", 'Icon path.');
                //console.log( JSON.stringify(rtnData) );

                page.listAuxAsync(2).then( function(rtnData) {
                    //console.log( JSON.stringify(rtnData) );
                    assert.strictEqual( rtnData.list.length, 0, 'No attachment file.');
                });
            });
        });
    })
    .catch( function(err) {dumpError('testGeoPageListAux', err)} );
};


function  testGeoPageAttach(myRepo)  {
    var  ngID = 35118,
         geID = 33537,
         file = '/Users/ben/Downloads/htmlBlock/css/photo/02.jpg';

    myRepo.findEntyAsync('myGeo', geID).then( function(geo) {
        geo.findPageAsync(ngID).then( function(page) {
            page.attachAsync({title: 'sub-page attachment', nType:2}, [file]).then( function(rtnData) {
                var  cnID = rtnData.value.id;
                page.detachAsync(cnID).then( function(rtnData) {
                    page.listAuxAsync(2).then( function(rtnData) {
                        assert.strictEqual( rtnData.list.length, 0, 'No attachment file.');
                    });
                });
            });
        });
    })
    .catch( function(err) {dumpError('testGeoPageAttach', err)} );
};


function  dumpError(caseName, err)  {
    console.log('[%s]: %s', caseName, JSON.stringify(err, null, 4));
};
