/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

const Async = require('async')
const Code = require('code')
const Lab = require('lab')
const TestUtils = require('../test_utils')
const FakeFactories = require('../../lib/modules/core/models/fake_factories')

const lab = exports.lab = Lab.script()

let mongoose
let server

lab.experiment('core/models Patient unit tests', () => {

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

  lab.experiment('models:Patient', () => {
    lab.test('Should have a virtual age field ' +
    'that is calculated based on birthday and todays date.', (done) => {
      Async.waterfall([
        function fakePatient(callback) {
          FakeFactories.patientFactory.createAndSave(
            1,
            { dob: new Date('1991-02-07') },
            callback
          )
        },
        function testPongReturned(patient, callback) {
          Code.expect(patient.age).to.be.equal(26)

          return callback(null)
        }
      ],
      function finish(err) {
        if (err) throw err

        return done()
      })
    })

  })

})
