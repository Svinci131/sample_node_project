/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

const Async = require('async')
const Code = require('code')
const FakeFactories = require('../../lib/modules/core/models/fake_factories')
const Lab = require('lab')
const TestUtils = require('../test_utils')

const lab = exports.lab = Lab.script()

let server
let mongoose

lab.experiment('core/patient controller integration tests', () => {

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

  lab.experiment('api:/api/v1.0/patients', () => {

    lab.experiment('List tests', () => {

      //Should return a max number of patients
      //Should be careful abt sensitive info

      lab.test('Should return an array of all patients.', (done) => {
        Async.waterfall([
          function fakePatients(callback) {
            FakeFactories.patientFactory.createAndSave(
              5,
              null,
              callback
            )
          },
          function listPatients(patients, callback) {
            const req = {
              method: 'GET',
              url: '/api/v1.0/patients'
            }

            server.inject(req, res => callback(null, res))
          },
          function testPatientsRetrieved(res, callback) {
            console.log(res.result)
            Code.expect(TestUtils.isRespSuccess(res, 200)).to.be.true()
            Code.expect(res.result.data.patients.length).to.equal(5)

            return callback()
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
