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

      /* Should return a max number of patients */
      /* Should be careful abt sensitive info */
      /* Should not include __v or any of that */
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
            Code.expect(TestUtils.isRespSuccess(res, 200)).to.be.true()
            Code.expect(res.result.data.patients.length)
              .to.equal(5)

            return callback()
          }
        ],
        function finish(err) {
          if (err) throw err

          return done()
        })
      })
    })

    lab.experiment('GET tests', () => {

      /* Should return 404 if patient doesn't exist */
      /* Should return 422 if id is not hex or not there */
      /* Should not include __v or any of that */
      /* Should not include virtuals */
      lab.test('Should return the patient document if found.', (done) => {
        Async.waterfall([
          function fakePatients(callback) {
            FakeFactories.patientFactory.createAndSave(
              5,
              null,
              callback
            )
          },
          function listPatients(patients, callback) {
            const patient = patients[0]
            const req = {
              method: 'GET',
              url: `/api/v1.0/patients/${patient._id}`
            }

            server.inject(req, res => callback(null, res, patient))
          },
          function testPatientRetrieved(res, _patient, callback) {
            console.log(res.result)
            Code.expect(TestUtils.isRespSuccess(res, 200)).to.be.true()

            const patient = res.result.data.patient
            Code.expect(patient._id).to.equal(_patient._id)

            //TODO FOR LOOP TEST
            return callback()
          }
        ],
        function finish(err) {
          if (err) throw err

          return done()
        })
      })

      lab.experiment('Error Handling', () => {

        lab.test('Should return 404 on batch doesn\'t exist.', (done) => {
          const req = {
            method: 'GET',
            url: '/api/v1.0/patients/123456789012345678901234'
          }

          server.inject(req, (res) => {
            Code.expect(TestUtils.isRespError(res, 404, 'Not Found'))
              .to.be.true()

            return done()
          })
        })

        lab.test('Should return 422 if bad id is given.', (done) => {
          const req = {
            method: 'GET',
            url: '/api/v1.0/patients/AAAA'
          }

          server.inject(req, (res) => {
            Code.expect(TestUtils.isRespError(res, 422, 'Invalid Data'))
              .to.be.true()

            return done()
          })
        })
      })

    })

  })

})
