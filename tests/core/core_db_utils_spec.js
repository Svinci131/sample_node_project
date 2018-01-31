/* eslint no-unused-vars: off, no-console: off */

const _ = require('lodash')
const Async = require('async')
const Boom = require('boom')
const Code = require('code')
const DbUtils = require('../../lib/modules/core/db_utils')
const Faker = require('faker')
const Lab = require('lab')
const Sinon = require('sinon')
const TestUtils = require('../test_utils')

const lab = exports.lab = Lab.script()

var server, mongoose, Cat

lab.experiment('core module tests', () => {

  lab.before((done) => {
    var onServerReady = function(_server, _mongoose) {
      server = _server
      mongoose = _mongoose
      Cat = mongoose.model('Cat', { name: String, createdAt: Date })

      return done()
    }
    TestUtils.setupServer(true, onServerReady)
  })

  lab.after((done) => {
    TestUtils.tearDownServer(mongoose, done)
  })

  lab.beforeEach((done) => {
    TestUtils.dropTestDatabase(mongoose.connection, done)
  })

  lab.experiment('core/db_utils tests', () => {

    function prepData1(done) {

      Async.waterfall([
        function fakeCats(callback) {
          var kitty1 = new Cat({ name: 'Kira', createdAt: new Date(2016, 5) })
          var kitty2 = new Cat({ name: 'Jira', createdAt: new Date(2016, 6) })
          var kitty3 = new Cat({ name: 'Mira', createdAt: new Date(2016, 7) })

          Async.parallel([
            function saveKitty1(cb) {
              kitty1.save(cb)
            },
            function saveKitty2(cb) {
              kitty2.save(cb)
            },
            function saveKitty3(cb) {
              kitty3.save(cb)
            }
          ],
          (err, results) => {
            if (err) {
              return callback(err)
            }

            return callback(null, [ kitty1, kitty2, kitty3 ])
          })
        }],
        function finish(err, res) {
          if (err) throw err

          return done(null, res)
        }
      )
    }

    lab.experiment('applyDbSort() tests', () => {

      lab.test('should sort database query results by cat name',
        (done) => {
          Async.waterfall([
            function prepareData(callback) {
              return prepData1(callback)
            },
            function testApplyDbSort(cats, callback) {
              let request = { query: { sort: 'name' } }
              DbUtils.applyDbSort(Cat.find({}), request).exec(callback)
            },
            function checkResultsAreSorted(cats, callback) {
              let catNames = _.map(cats, 'name')
              let expectedCatNames = ['Jira', 'Kira', 'Mira']
              Code.expect(_.isEqual(catNames, expectedCatNames)).to.be.true()

              return callback()
            }
          ],
          function finish(err, result) {
            if (err) throw err

            return done()
          })
        }
      )

      lab.test('should sort database query results for findOne() calls',
        (done) => {
          Async.waterfall([
            function prepareData(callback) {
              return prepData1(callback)
            },
            function testApplyDbSort(cats, callback) {
              let request = { query: { sort: 'name' } }
              DbUtils.applyDbSort(
                Cat.findOne({ name: 'Kira'}),
                request
              ).exec(callback)
            },
            function checkResultsAreSorted(cat, callback) {
              Code.expect(cat.name).to.equal('Kira')

              return callback()
            }
          ],
          function finish(err, result) {
            if (err) throw err

            return done()
          })
        }
      )

    })

    lab.experiment('applyDbSelects() tests', () => {

      lab.test('should remove __v field from find() calls', (done) => {
        Async.waterfall([
          function prepareData(callback) {
            return prepData1(callback)
          },
          function test(cats, callback) {
            DbUtils.applyDbSelects(
              Cat.find({ name: 'Kira' })
            ).exec(callback)
          },
          function checkRemoval(cats, callback) {
            Code.expect(cats[0].__v).to.be.undefined()
            return callback()
          }
        ],
        function finish(err, result) {
          if (err) throw err

          return done()
        })
      })

      lab.test('should remove __v field from findOne() calls', (done) => {
        Async.waterfall([
          function prepareData(callback) {
            return prepData1(callback)
          },
          function test(cats, callback) {
            DbUtils.applyDbSelects(
              Cat.findOne({ name: 'Kira' })
            ).exec(callback)
          },
          function checkRemoval(cat, callback) {
            Code.expect(cat.__v).to.be.undefined()
            return callback()
          }
        ],
        function finish(err, result) {
          if (err) throw err

          return done()
        })
      })

    })

    lab.experiment('applyPagination', () => {

      function prepData2(done) {
        return Async.map(
          _.range(10),
          (i, callback) => {
            new Cat({
              name: Faker.name.firstName(),
              createdAt: new Date(2015, i)
            }).save(callback)
          },
          (err, cats) => {
            if (err) return done(err)

            return done(null, cats)
          }
        )
      }

      lab.test('should return 3 items on page 1 when no pageRefItem provided ' +
        'and 10 items exist in database',
        (done) => {
          Async.waterfall([
            function prepareData(callback) {
              return prepData2(callback)
            },
            function testDbPagination(cats, callback) {
              DbUtils.applyDbPagination(
                Cat.find().sort('_id'),
                { query: { pageLimit: 3 } }
              ).exec((err, paginatedCats) => {
                return callback(err, cats, paginatedCats)
              })
            },
            function checkResults(cats, paginatedCats, callback) {
              let expectedCats = cats.slice(0, 3)

              Code.expect(
                _.map(paginatedCats, '_id')
              ).equal(_.map(expectedCats, '_id'))

              return callback()
            }
          ],
          function finish(err, result) {
            if (err) throw err

            return done()
          })
        }
      )

      lab.test('should return 3 items on page 2 when 10 items exist in ' +
        'database and pageLimit is set to 3', (done) => {
        Async.waterfall([
          function prepareData(callback) {
            return prepData2(callback)
          },
          function testDbPagination(cats, callback) {
            DbUtils.applyDbPagination(
              Cat.find().sort('_id'),
              { query: { pageRefItem: cats[2]._id, pageLimit: 3 } }
            ).exec((err, paginatedCats) => {
              return callback(err, cats, paginatedCats)
            })
          },
          function checkResults(cats, paginatedCats, callback) {
            let expectedCats = cats.slice(3, 6)

            Code.expect(
              _.map(paginatedCats, '_id')
            ).equal(_.map(expectedCats, '_id'))

            return callback()
          }
        ],
        function finish(err, result) {
          if (err) throw err

          return done()
        })
      })

      lab.test('should return 3 items on page 2 when 10 items exist in ' +
        'database, pageLimit is set to 3, and result set is sorted in ' +
        'descending order', (done) => {
        Async.waterfall([
          function prepareData(callback) {
            return prepData2(callback)
          },
          function testDbPagination(cats, callback) {
            DbUtils.applyDbPagination(
              Cat.find().sort('-_id'),
              { query: { pageRefItem: cats[7]._id, pageLimit: 3 } }
            ).exec((err, paginatedCats) => {
              return callback(err, cats, paginatedCats)
            })
          },
          function checkResults(cats, paginatedCats, callback) {
            let expectedCats = cats.slice(4, 7).reverse()

            Code.expect(
              _.map(paginatedCats, '_id')
            ).equal(_.map(expectedCats, '_id'))

            return callback()
          }
        ],
        function finish(err, result) {
          if (err) throw err

          return done()
        })
      })

      lab.test('should return 1 item on page 4 when 10 items exist ' +
        'in database and pageLimit is set to 3', (done) => {
        Async.waterfall([
          function prepareData(callback) {
            return prepData2(callback)
          },
          function testDbPagination(cats, callback) {
            DbUtils.applyDbPagination(
              Cat.find().sort('createdAt'),
              { query: { pageRefItem: cats[8].createdAt, pageLimit: 3 } }
            ).exec((err, paginatedCats) => {
              return callback(err, cats, paginatedCats)
            })
          },
          function checkResults(cats, paginatedCats, callback) {
            let expectedCats = cats.slice(9)

            Code.expect(
              _.map(paginatedCats, '_id')
            ).equal(_.map(expectedCats, '_id'))

            return callback()
          }
        ],
        function finish(err, result) {
          if (err) throw err

          return done()
        })
      })

    })

    lab.experiment('groomQuery() tests', () => {

      lab.test('should call constituent functions', (done) => {
        Async.waterfall([
          function prepareData(callback) {
            return prepData1(callback)
          },
          function test(cats, callback) {
            let applyDbSelectsSpy = Sinon.spy(DbUtils, 'applyDbSelects')
            let applyDbSortSpy = Sinon.spy(DbUtils, 'applyDbSort')
            let applyDbPaginationSpy = Sinon.spy(DbUtils, 'applyDbPagination')

            DbUtils.groomQuery(Cat.find({}), null)
            Code.expect(applyDbSelectsSpy.calledOnce)
            Code.expect(applyDbSortSpy.calledOnce)
            Code.expect(applyDbPaginationSpy.calledOnce)

            return callback()
          }
        ],
        function finish(err, result) {
          if (err) throw err

          return done()
        })
      })

    })

  })

})
