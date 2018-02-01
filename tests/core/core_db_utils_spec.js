/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

const _ = require('lodash')
const Async = require('async')
const Boom = require('boom')
const Code = require('code')
const Config = require('config')
const DbUtils = require('../../lib/modules/core/db_utils')
const expect = require('chai').expect
const Faker = require('faker')
const Lab = require('lab')
const Mongoose = require('mongoose')
// const Utils = require('@bondco/ps-utils')
const TestUtils = require('../test_utils')

const lab = exports.lab = Lab.script()
const Schema = Mongoose.Schema

let server
let mongoose
let Cat

const breedSchema = Schema({
  name: String,
  color: String
})

function prepData1(done) {
  Async.waterfall([
    function fakeCats(callback) {
      const kitty1 = new Cat({
        name: 'Kira',
        createdAt: new Date(2016, 5),
        breed: {
          name: 'ccccc'
        }
      })
      const kitty2 = new Cat({
        name: 'Jira',
        createdAt: new Date(2016, 6),
        breed: {
          name: 'aaaaa'
        }
      })
      const kitty3 = new Cat({
        name: 'Mira',
        createdAt: new Date(2016, 7),
        breed: {
          name: 'bbbbb'
        }
      })

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
        if (err) callback(err)
        return callback(null, [kitty1, kitty2, kitty3])
      })
    }],
    function finish(err, res) {
      if (err) throw err
      return done(null, res)
    })
}

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

function createAlaphabeticallyNamedData(done) {
  return Async.map(
    _.range(10),
    (i, callback) => {
      new Cat({
        name: String.fromCharCode(i + 97),
        createdAt: new Date(2015, i)
      }).save(callback)
    },
    (err, cats) => {
      if (err) return done(err)

      return done(null, cats)
    }
  )
}

function createXNumberCats(number, done) {
  return Async.map(
    _.range(number),
    (i, callback) => {
      new Cat({
        name: String.fromCharCode(i + 97),
        createdAt: new Date(2015, i)
      }).save(callback)
    },
    (err, cats) => {
      if (err) return done(err)

      return done(null, cats)
    }
  )
}

lab.experiment('util_db tests', () => {
  lab.before((done) => {
    const onServerReady = function(_server, _mongoose) {
      server = _server
      mongoose = _mongoose
      Cat = mongoose.model('Cat', {
        name: String,
        createdAt: Date,
        hid: Number,
        breed: breedSchema
      })

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


  /* ------------------------------------

    SORT

  --------------------------------------- */
  /* if sort (num) */
  /* if reverse sort (num) */
  /* if reverse sort (deeply nested)) */
  lab.experiment('applyDbSort', () => {
    /* if sort (string) */
    lab.test('should sort database query results by cat name',
    (done) => {
      Async.waterfall([
        function prepareData(callback) {
          return prepData1(callback)
        },
        function testApplyDbSort(cats, callback) {
          const request = { query: { sort: 'name' } }
          DbUtils.applyDbSort(Cat.find({}), request).exec(callback)
        },
        function checkResultsAreSorted(cats, callback) {
          const catNames = _.map(cats, 'name')
          const expectedCatNames = ['Jira', 'Kira', 'Mira']
          Code.expect(_.isEqual(catNames, expectedCatNames)).to.be.true()

          return callback()
        }
      ],
      function finish(err, result) {
        if (err) throw err

        return done()
      })
    })

    /* if reverse sort (string) */
    lab.test('should sort database query results by cat name in reverse',
      (done) => {
        Async.waterfall([
          function prepareData(callback) {
            return prepData1(callback)
          },
          function testApplyDbSort(cats, callback) {
            const request = { query: { sort: '-name' } }
            DbUtils.applyDbSort(Cat.find({}), request).exec(callback)
          },
          function checkResultsAreSorted(cats, callback) {
            const catNames = _.map(cats, 'name')
            const expectedCatNames = ['Mira', 'Kira', 'Jira']
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

    /* if sort (nested)) */
    lab.test('should sort database query results by nested field vals name',
    (done) => {
      Async.waterfall([
        function prepareData(callback) {
          return prepData1(callback)
        },
        function testApplyDbSort(data, callback) {
          const request = { query: { sort: 'breed.name' } }
          DbUtils.applyDbSort(Cat.find({}), request).exec(callback)
        },
        function checkResultsAreSorted(cats, callback) {
          const catBreedNames = cats.map(cat => cat.breed.name)
          const expectedNames = ['aaaaa', 'bbbbb', 'ccccc']

          Code.expect(catBreedNames).equal(expectedNames)
          return callback()
        }
      ],
      function finish(err, result) {
        if (err) throw err
        return done()
      })
    })

    /* if reverse sort (nested)) */
    lab.test('should sort database query results by nested field vals name',
    (done) => {
      Async.waterfall([
        function prepareData(callback) {
          return prepData1(callback)
        },
        function testApplyDbSort(data, callback) {
          const request = { query: { sort: '-breed.name' } }
          DbUtils.applyDbSort(Cat.find({}), request).exec(callback)
        },
        function checkResultsAreSorted(cats, callback) {
          const catBreedNames = cats.map(cat => cat.breed.name)
          const expectedNames = ['ccccc', 'bbbbb', 'aaaaa']

          Code.expect(catBreedNames).equal(expectedNames)
          return callback()
        }
      ],
      function finish(err, result) {
        if (err) throw err
        return done()
      })
    })

    function createAlaphabeticallyNamedXNumberedData(count, done) {
      return Async.map(
        _.range(4),
        (i, callback) => {
          new Cat({
            name: String.fromCharCode(i + 97, i + 97, i + 97, i + 97),
            hid: count ? i + 1 : i + 2,
            createdAt: new Date(2015, i)
          }).save(callback)
        },
        (err, cats) => {
          if (err) return done(err)

          return done(null, cats)
        }
      )
    }

    lab.test('should sort by multiple fields', (done) => {
      Async.waterfall([
        function prepareData(callback) {
          createAlaphabeticallyNamedXNumberedData(false, callback)
        },
        function prepareData(count, callback) {
          createAlaphabeticallyNamedXNumberedData(true, callback)
        },
        function testApplyDbSort(cats, callback) {
          const request = { query: { sort: 'name,hid' } }

          DbUtils.applyDbSort(
            Cat.find({}),
            request
          ).exec(callback)
        },
        function testSortedDataReturned(cats, callback) {
            Code.expect(cats).to.have.length(8)

            const actual = cats.map(cat => cat.name  + '-' + cat.hid)
            const expected = ['aaaa-1', 'aaaa-2', 'bbbb-2', 'bbbb-3', 'cccc-3', 'cccc-4', 'dddd-4', 'dddd-5']

            Code.expect(_.isEqual(actual, expected)).to.be.true()

            return callback(null, null)
          }
      ],
      function finish(err, result) {
        if (err) throw err
        return done()
      })
    })

    lab.test('should sort by multiple fields by ascending and descending order', (done) => {
      Async.waterfall([
        function prepareData(callback) {
          createAlaphabeticallyNamedXNumberedData(false, callback)
        },
        function prepareData(count, callback) {
          createAlaphabeticallyNamedXNumberedData(true, callback)
        },
        function testApplyDbSort(cats, callback) {
          const request = { query: { sort: 'name,-hid' } }

          DbUtils.applyDbSort(
            Cat.find({}),
            request
          ).exec(callback)
        },
        function testSortedDataReturned(cats, callback) {
            Code.expect(cats).to.have.length(8)

            const actual = cats.map(cat => cat.name  + '-' + cat.hid)
            const expected = ['aaaa-2', 'aaaa-1', 'bbbb-3', 'bbbb-2', 'cccc-4', 'cccc-3', 'dddd-5', 'dddd-4']

            Code.expect(_.isEqual(actual, expected)).to.be.true()

            return callback(null, null)
          }
      ],
      function finish(err, result) {
        if (err) throw err
        return done()
      })
    })

    lab.test('should sort database query results for findOne() calls',
    (done) => {
      Async.waterfall([
        function prepareData(callback) {
          return prepData1(callback)
        },
        function testApplyDbSort(cats, callback) {
          const request = { query: { sort: 'name' } }
          DbUtils.applyDbSort(
            Cat.findOne({ name: 'Kira' }),
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
    })
  })

  /* ------------------------------------

    PAGINATION

  --------------------------------------- */
  lab.experiment('applyDbPagination', () => {
    /* if no page limit should return all */
    lab.test('if no page limit should return all', (done) => {
      Async.waterfall([
        function prepareData10Docs(callback) {
          return prepData2(callback)
        },
        function testDbPagination(cats, callback) {
          DbUtils.applyDbPagination(
            Cat.find().sort('_id'),
            { query: {} }
          ).exec((err, paginatedCats) => callback(err, cats, paginatedCats))
        },
        function checkResults(cats, paginatedCats, callback) {
          Code.expect(cats).to.have.length(10)
          return callback()
        }
      ],
      function finish(err, result) {
        if (err) throw err
        return done()
      })
    })

    /* if page limit and no offset */
    /* if page limit is less than num of docs */
    lab.test('should return 3 items on page 1 when page Limit is 10, ' +
      'no offset provided ' +
      'and 10 items exist in database', (done) => {
      Async.waterfall([
        function prepareData(callback) {
          return prepData2(callback)
        },
        function testDbPagination(cats, callback) {
          DbUtils.applyDbPagination(
            Cat.find().sort('_id'),
            { query: { pageLimit: 3 } }
          ).exec((err, paginatedCats) => callback(err, cats, paginatedCats))
        },
        function checkResults(cats, paginatedCats, callback) {
          const expectedCats = cats.slice(0, 3)

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

    /* if page limit is greater than num of docs */
    lab.test('should return 10 items on page 1 when page Limit is 11' +
      'no offset provided ' +
      'and 10 items exist in database', (done) => {
      Async.waterfall([
        function prepareData(callback) {
          return prepData2(callback)
        },
        function testDbPagination(cats, callback) {
          DbUtils.applyDbPagination(
            Cat.find().sort('_id'),
            { query: { pageLimit: 10 } }
          ).exec((err, paginatedCats) => callback(err, cats, paginatedCats))
        },
        function checkResults(cats, paginatedCats, callback) {
          Code.expect(paginatedCats).to.have.length(10)
          return callback()
        }
      ],
      function finish(err, result) {
        if (err) throw err

        return done()
      })
    })

    /* if offset and page limit */
    lab.test('should return 3 items on page 2 when 10 items exist in ' +
      'database, pageLimit is set to 3, and offset is 3', (done) => {
      Async.waterfall([
        function prepareData(callback) {
          return prepData2(callback)
        },
        function testDbPagination(cats, callback) {
          DbUtils.applyDbPagination(
            Cat.find().sort('-_id'),
            { query: { offset: 3, pageLimit: 3 } }
          ).exec((err, paginatedCats) => callback(err, cats, paginatedCats))
        },
        function checkResults(cats, paginatedCats, callback) {
          const expectedCats = cats.slice(4, 7).reverse()
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

    /* if 1 offset 9 and page limit is 3 and there are 10 docs */
    /* desc order */
    lab.test('should return 1 if offset 10 and page limit is 3'
      + 'and there are 11 docs', (done) => {
      Async.waterfall([
        function prepareData(callback) {
          return prepData2(callback)
        },
        function testDbPagination(cats, callback) {
          const catNames = _.map(cats, 'name')

          DbUtils.applyDbPagination(
            Cat.find().sort('-_id'),
            { query: { offset: 9, pageLimit: 3 } }
          ).exec((err, paginatedCats) => callback(err, cats, paginatedCats))
        },
        function checkResults(cats, paginatedCats, callback) {
          const lastCat = cats.reverse()[cats.length - 1].name

          Code.expect(paginatedCats).to.have.length(1)
          Code.expect(paginatedCats[0].name).to.equal(lastCat)
          return callback()
        }
      ],
      function finish(err, result) {
        if (err) throw err
        return done()
      })
    })

    lab.test('should return 3 items on page 2 when 10 items exist in ' +
      'database and pageLimit is set to 3', (done) => {
      Async.waterfall([
        function prepareData(callback) {
          return prepData2(callback)
        },
        function testDbPagination(cats, callback) {
          DbUtils.applyDbPagination(
            Cat.find().sort('_id'),
            { query: { offset: 3, pageLimit: 3 } }
          ).exec((err, paginatedCats) => callback(err, cats, paginatedCats))
        },
        function checkResults(cats, paginatedCats, callback) {
          const expectedCats = cats.slice(3, 6)

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
            { query: { offset: 9, pageLimit: 3 } }
          ).exec((err, paginatedCats) => callback(err, cats, paginatedCats))
        },
        function checkResults(cats, paginatedCats, callback) {
          const expectedCats = cats.slice(9)

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

    lab.test('should use default_page_limit if config is present, ' +
      'but there is no pageLimit in the query', (done) => {
      Async.waterfall([
        function prepareData(callback) {
          return createXNumberCats(150, callback)
        },
        function testDbPagination(cats, callback) {
          DbUtils.applyDbPagination(
            Cat.find().sort('createdAt'),
            { query: {} },
            Config
          ).exec((err, paginatedCats) => callback(err, cats, paginatedCats))
        },
        function checkResults(cats, paginatedCats, callback) {
          Code.expect(paginatedCats).to.have.length(50)

          return callback()
        }
      ],
      function finish(err, result) {
        if (err) throw err

        return done()
      })
    })


    lab.test('should return 100 pages if no limit or config is passed in', (done) => {
      Async.waterfall([
        function prepareData(callback) {
          return createXNumberCats(150, callback)
        },
        function testDbPagination(cats, callback) {
          DbUtils.applyDbPagination(
            Cat.find().sort('createdAt'),
            { query: {} }
          ).exec((err, paginatedCats) => callback(err, cats, paginatedCats))
        },
        function checkResults(cats, paginatedCats, callback) {
          Code.expect(paginatedCats).to.have.length(100)

          return callback()
        }
      ],
      function finish(err, result) {
        if (err) throw err

        return done()
      })
    })
  })

  /* ------------------------------------

    SORT AND PAGINATION

  --------------------------------------- */
  lab.experiment('Sort and Pagaination', () => {
    /* if sort (unique) and page limit */
    lab.test('should return 3 items on page 1 beginning with a'
      + 'when given 10 docs are alphabetically ordered names'
      + 'and sort equals "name"', (done) => {
      Async.waterfall([
        function prepareData(callback) {
          return createAlaphabeticallyNamedData(callback)
        },
        function testDbPaginationAndSort(cats, callback) {
          const queryResult = Cat.find({})
          const request = { query: { pageLimit: 3, sort: 'name' } }
          DbUtils.applyDbPagination(
            DbUtils.applyDbSort(queryResult, request),
            request
          ).exec((err, paginatedCats) => callback(err, cats, paginatedCats))
        },
        function checkResults(cats, paginatedCats, callback) {
          const expectedCats = cats.slice(0, 3)
          Code.expect(paginatedCats[0].name).to.equal('a')
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

    /* if sort and page limit and offset */
    lab.test('should return 3 items on page 2 staring w/ d'
      + 'when given 10 docs with alphabetically ordered names'
      + 'and sort "name"', (done) => {
      Async.waterfall([
        function prepareData(callback) {
          return createAlaphabeticallyNamedData(callback)
        },
        function testDbPaginationAndSort(cats, callback) {
          const queryResult = Cat.find({})
          const request = { query: { offset: 3, pageLimit: 3, sort: 'name' } }
          DbUtils.applyDbPagination(
            DbUtils.applyDbSort(queryResult, request),
            request
          ).exec((err, paginatedCats) => callback(err, cats, paginatedCats))
        },
        function checkResults(cats, paginatedCats, callback) {
          const expectedCats = cats.slice(3, -4)

          Code.expect(paginatedCats[0].name).to.equal('d')
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


    /* if reverse sort and page limit */
    lab.test('should return 3 items on page 1 staring w/ j'
      + 'when given 10 docs with alphabetically ordered names'
      + 'and sort equals "-name"', (done) => {
      Async.waterfall([
        function prepareData(callback) {
          return createAlaphabeticallyNamedData(callback)
        },
        function testDbPaginationAndSort(cats, callback) {
          const queryResult = Cat.find()
          const request = { query: { pageLimit: 3, sort: '-name' } }

          DbUtils.applyDbPagination(
            DbUtils.applyDbSort(queryResult, request),
            request
          ).exec((err, paginatedCats) => callback(err, cats, paginatedCats))
        },
        function checkResults(cats, paginatedCats, callback) {
          const expectedCatNames = _.map(cats, 'name').reverse().slice(0, 3)
          const paginatedCatNames = _.map(paginatedCats, 'name')

          Code.expect(paginatedCats[0].name).to.equal('j')
          Code.expect(expectedCatNames)
          .equal(paginatedCatNames)

          return callback()
        }
      ],
      function finish(err, result) {
        if (err) throw err

        return done()
      })
    })

    /* if reverse sort and page limit and offset */
    lab.test('should return 3 items on page 2 staring w/ g'
      + 'when given ten with alphabetically ordered names'
      + 'and sort equals "-name"', (done) => {
      Async.waterfall([
        function prepareData(callback) {
          return createAlaphabeticallyNamedData(callback)
        },
        function testDbPaginationAndSort(cats, callback) {
          const queryResult = Cat.find()
          const request = { query: { offset: 3, pageLimit: 3, sort: '-name' } }

          DbUtils.applyDbPagination(
            DbUtils.applyDbSort(queryResult, request),
            request
          ).exec((err, paginatedCats) => callback(err, cats, paginatedCats))
        },
        function checkResults(cats, paginatedCats, callback) {
          const expectedCatNames = _.map(cats, 'name').reverse().slice(3, -4)
          const paginatedCatNames = _.map(paginatedCats, 'name')

          Code.expect(paginatedCats[0].name).to.equal('g')
          Code.expect(expectedCatNames)
          .equal(paginatedCatNames)

          return callback()
        }
      ],
      function finish(err, result) {
        if (err) throw err

        return done()
      })
    })

    /* if sort and page limit and offset (non-unque) */
    /* if sort and page limit and offset (nested) */
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

  lab.experiment('applyDBCount() tests', () => {
    lab.test('should return number if given count=true in query params', (done) => {
      Async.waterfall([
        function prepareData(callback) {
          return prepData2(callback)
        },
        function test(cats, callback) {
          DbUtils.groomQuery(
            Cat.find({}),
            { query: { count: true } }
          ).exec(callback)
        },
        function checkRemoval(cats, callback) {
          Code.expect(cats).to.equal(10)
          return callback(null)
        }
      ],
      function finish(err) {
        if (err) throw err

        return done()
      })
    })

  })

  lab.experiment('groomQuery() tests', () => {
    lab.test('should return list if no query params', (done) => {
      Async.waterfall([
        function prepareData(callback) {
          return prepData2(callback)
        },
        function test(cats, callback) {
          DbUtils.groomQuery(
            Cat.find({}),
            {}
          ).exec(callback)
        },
        function checkRemoval(cats, callback) {
          Code.expect(cats).to.have.length(10)
          return callback()
        }
      ],
      function finish(err, result) {
        if (err) throw err

        return done()
      })
    })

    lab.test('should return list if no sort params', (done) => {
      Async.waterfall([
        function prepareData(callback) {
          return prepData2(callback)
        },
        function test(cats, callback) {
          DbUtils.groomQuery(
            Cat.find({}),
            { query: { pageLimit: 3 } }
          ).exec(callback)
        },
        function checkRemoval(cats, callback) {
          Code.expect(cats).to.have.length(3)
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