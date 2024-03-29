/* eslint disable no-unused-vars: off, no-console: off */

const Async = require('async')
const Code = require('code')
const Lab = require('lab')
const TestUtils = require('../test_utils')

const lab = exports.lab = Lab.script()

let mongoose
let server

lab.experiment('core/misc misc integration tests', () => {

  lab.before((done) => {
    const onServerReady = function(_server, _mongoose) {
      server = _server
      mongoose = _mongoose
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

  lab.experiment('api:/ping', () => {

    lab.experiment('GET tests', () => {

      lab.test('should return pong response', (done) => {
        Async.waterfall([
          function getPing(callback) {
            const req = {
              method: 'GET',
              url: '/ping'
            }

            server.inject(req, res => callback(null, res))
          },
          function testPongReturned(res, callback) {
            Code.expect(TestUtils.isRespSuccess(res, 200)).to.be.true()
            Code.expect(res.result.data).to.equal('pong')
            return callback(null, null)
          }
        ],
        function finish(err) {
          if (err) throw err

          return done()
        })
      })

    })

  })

})
