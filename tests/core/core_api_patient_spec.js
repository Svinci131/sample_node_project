/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

const _ = require('lodash')
const Async = require('async')
const Code = require('code')
const Faker = require('faker')
const FakeFactories = require('../../lib/modules/core/models/fake_factories')
const Lab = require('lab')
const Models = require('../../lib/modules/core/models')
const TestUtils = require('../test_utils')

const lab = exports.lab = Lab.script()

let server
let mongoose

const notFoundTestId = '5a722b831657032959775a11'

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

      /* Should be careful abt sensitive info */
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

            const patients = res.result.data.patients
            Code.expect(patients).to.have.length(5)

            patients.forEach((patient) => {
              /* Should not include __v or any of that */
              _noPrivateFieldsInResponse(patient)
            })

            return callback()
          }
        ],
        function finish(err) {
          if (err) throw err

          return done()
        })
      })

      lab.test('Should return 50 patients by default', (done) => {
        Async.waterfall([
          function fakePatients(callback) {
            FakeFactories.patientFactory.createAndSave(
              51,
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

            const patients = res.result.data.patients
            Code.expect(patients).to.have.length(50)

            patients.forEach((patient) => {
              /* Should not include __v or any of that */
              _noPrivateFieldsInResponse(patient)
            })

            return callback()
          }
        ],
        function finish(err) {
          if (err) throw err

          return done()
        })
      })

      lab.test('Should return be able to grab up to 300 patients at a time', (done) => {
        Async.waterfall([
          function fakePatients(callback) {
            FakeFactories.patientFactory.createAndSave(
              301,
              null,
              callback
            )
          },
          function listPatients(patients, callback) {
            const req = {
              method: 'GET',
              url: '/api/v1.0/patients?pageLimit=300'
            }

            server.inject(req, res => callback(null, res))
          },
          function testPatientsRetrieved(res, callback) {
            Code.expect(TestUtils.isRespSuccess(res, 200)).to.be.true()

            const patients = res.result.data.patients
            Code.expect(patients).to.have.length(300)

            patients.forEach((patient) => {
              /* Should not include __v or any of that */
              _noPrivateFieldsInResponse(patient)
            })

            return callback()
          }
        ],
        function finish(err) {
          if (err) throw err

          return done()
        })
      })

      lab.test('Should return an error if attempting to get more ' +
      'than to 300 patients at a time.', (done) => {
        Async.waterfall([
          function fakePatients(callback) {
            FakeFactories.patientFactory.createAndSave(
              301,
              null,
              callback
            )
          },
          function listPatients(patients, callback) {
            const req = {
              method: 'GET',
              url: '/api/v1.0/patients?pageLimit=301'
            }

            server.inject(req, res => callback(null, res))
          },
          function testPatientsRetrieved(res, callback) {
            const errMessage = '"pageLimit" must be less than or equal to 300'
            Code.expect(TestUtils.isRespError(
            res, 400, 'Invalid Data', null)).to.be.true()
            Code.expect(res.result.data[0].message).to.equal(errMessage)

            return callback()
          }
        ],
        function finish(err) {
          if (err) throw err

          return done()
        })
      })

      /* BONUS */
      lab.test('Should be able to filter list w query params.', (done) => {
        Async.waterfall([
          function fakePatientsWTermsAccepted(callback) {
            FakeFactories.patientFactory.createAndSave(
              7,
              { termsAccepted: true },
              callback
            )
          },
          function fakePatientsWTermsAccepted(patients, callback) {
            FakeFactories.patientFactory.createAndSave(
              4,
              { termsAccepted: false },
              callback
            )
          },
          function listPatients(patients, callback) {
            const req = {
              method: 'GET',
              url: '/api/v1.0/patients?termsAccepted=true'
            }

            server.inject(req, res => callback(null, res))
          },
          function testPatientsRetrieved(res, callback) {
            Code.expect(TestUtils.isRespSuccess(res, 200)).to.be.true()

            const patients = res.result.data.patients
            Code.expect(patients).to.have.length(7)

            patients.forEach((patient) => {
              _noPrivateFieldsInResponse(patient)
            })

            return callback()
          }
        ],
        function finish(err) {
          if (err) throw err

          return done()
        })
      })

      lab.test.skip('Should be able to filter list by nested fields.', (done) => {
        Async.waterfall([
          function fakePatientsWTermsAccepted(callback) {
            FakeFactories.patientFactory.createAndSave(
              7,
              {
                address: {
                  line1: Faker.address.streetAddress(),
                  city: 'la',
                  state: Faker.address.state(),
                  zip: Faker.address.zipCode()
                }
              },
              callback
            )
          },
          function fakePatientsWTermsAccepted(patients, callback) {
            FakeFactories.patientFactory.createAndSave(
              4,
              {
                address: {
                  line1: Faker.address.streetAddress(),
                  city: 'ny',
                  state: Faker.address.state(),
                  zip: Faker.address.zipCode()
                }
              },
              callback
            )
          },
          function listPatients(patients, callback) {
            const req = {
              method: 'GET',
              url: '/api/v1.0/patients?address.city=ny'
            }

            server.inject(req, res => callback(null, res))
          },
          function testPatientsRetrieved(res, callback) {
            Code.expect(TestUtils.isRespSuccess(res, 200)).to.be.true()

            const patients = res.result.data.patients
            Code.expect(patients).to.have.length(4)

            patients.forEach((patient) => {
              Code.expect(patient.address).to.equal('ny')
            })

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

      lab.test('Should return the patient document if found.', (done) => {
        Async.waterfall([
          function fakePatients(callback) {
            FakeFactories.patientFactory.createAndSave(
              5,
              null,
              callback
            )
          },
          function getPatient(patients, callback) {
            const patient = patients[0]
            const req = {
              method: 'GET',
              url: `/api/v1.0/patients/${patient._id}`
            }

            server.inject(req, res => callback(null, res, patient))
          },
          function testPatientRetrieved(res, _patient, callback) {
            Code.expect(TestUtils.isRespSuccess(res, 200)).to.be.true()

            const patient = res.result.data.patient
            Code.expect(patient._id).to.equal(_patient._id)
            /* Should not include __v or any of that */
            _noPrivateFieldsInResponse(patient)
            return callback()
          }
        ],
        function finish(err) {
          if (err) throw err

          return done()
        })
      })

      lab.test('Should include virtual fields [age] in reponse.', (done) => {
        Async.waterfall([
          function fakePatients(callback) {
            FakeFactories.patientFactory.createAndSave(
              5,
              { dob: new Date('1991-02-07') },
              callback
            )
          },
          function getPatient(patients, callback) {
            const patient = patients[0]
            const req = {
              method: 'GET',
              url: `/api/v1.0/patients/${patient._id}`
            }

            server.inject(req, res => callback(null, res, patient))
          },
          function testPatientRetrieved(res, _patient, callback) {
            Code.expect(TestUtils.isRespSuccess(res, 200)).to.be.true()

            const patient = res.result.data.patient
            Code.expect(patient._id).to.equal(_patient._id)
            Code.expect(patient.age).to.equal(26)

            /* Should not include __v or any of that */
            _noPrivateFieldsInResponse(patient)

            return callback()
          }
        ],
        function finish(err) {
          if (err) throw err

          return done()
        })
      })

      lab.experiment('Error Handling', () => {

        lab.test('Should return 404 if not patient with the given id exists.', (done) => {
          const req = {
            method: 'GET',
            url: `/api/v1.0/patients/${notFoundTestId}`
          }

          server.inject(req, (res) => {
            Code.expect(TestUtils.isRespError(res, 404, 'Not Found')).to.be.true()

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

    lab.experiment('CREATE tests', () => {

      lab.test('Should create a new patient document and return it.', (done) => {
        Async.waterfall([
          function fakePatientJSON(callback) {
            FakeFactories.patientFactory.create(
              1,
              null,
              callback
            )
          },
          function createPatients(patient, callback) {
            const req = {
              method: 'POST',
              url: '/api/v1.0/patients',
              payload: patient
            }

            server.inject(req, res => callback(null, res, patient))
          },
          function testPatientRetrieved(res, _patient, callback) {
            Code.expect(TestUtils.isRespSuccess(res, 200)).to.be.true()

            const patient = res.result.data.patient

            /* Should not include __v or any of that */
            Code.expect(patient.id)
              .to.equal(_patient._id)
            Code.expect(patient.__v).to.be.undefined()

            return callback(null, patient)
          },
          function testPatientSavedInDb(_patient, callback) {
            Models.Patient.find({}, function(err, patients) {
              if (err) return callback(err)
              Code.expect(patients).to.have.length(1)

              const patient = patients[0]
              Code.expect(patient._id).to.equal(_patient._id)

              /* test no nested docs have _id or id */
              Code.expect(patient.address._id).to.be.undefined()
              Code.expect(patient.address.__v).to.be.undefined()
              const phone = patient.phones[0]
              Code.expect(phone._id).to.be.undefined()
              Code.expect(phone.__v).to.be.undefined()

              return callback(null)
            })
          }
        ],
        function finish(err) {
          if (err) throw err

          return done()
        })
      })

      lab.experiment('Error Handling', () => {
        lab.test('Should not create a patient with the same email as ' +
        'an existing patient.', (done) => {
          Async.waterfall([
            function fakePatient(callback) {
              FakeFactories.patientFactory.createAndSave(
                1,
                {
                  firstName: 'sara',
                  email: 'iamunique@test.com'
                },
                callback
              )
            },
            function fakePatient(patient, callback) {
              FakeFactories.patientFactory.create(
                1,
                {
                  firstName: 'Ben',
                  email: 'iamunique@test.com'
                },
                callback
              )
            },
            function createPatient(patient, callback) {
              const req = {
                method: 'POST',
                url: '/api/v1.0/patients',
                payload: patient
              }

              server.inject(req, res => callback(null, res))
            },
            function testPatientRetrieved(res, callback) {
              const errMessage = 'Conflict: email must be unique'
              Code.expect(TestUtils.isRespError(res, 409, errMessage))
                .to.be.true()

              return callback(null)
            },
            function testDuplicatePatientNotSavedInDb(callback) {
              Models.Patient.find({}, function(err, patients) {
                if (err) return callback(err)
                Code.expect(patients).to.have.length(1)
                Code.expect(patients[0].firstName).to.equal('sara')

                return callback(null)
              })
            }
          ],
          function finish(err) {
            if (err) throw err

            return done()
          })
        })

        lab.test('Should return 422 if attempting to make name an empty string.', (done) => {
          Async.waterfall([
            function fakePatientJSON(callback) {
              FakeFactories.patientFactory.create(
                1,
                null,
                callback
              )
            },
            function createPatient(patient, callback) {
              const payload = _.cloneDeep(patient.toJSON())
              delete payload.id
              delete payload._id
              payload.lastName = ''

              const req = {
                method: 'POST',
                url: '/api/v1.0/patients',
                payload: payload
              }

              server.inject(req, res => callback(null, res, patient))
            },
            function testPatientNotUpdated(res, _patient, callback) {
              const errMessage = 'child "lastName" fails because ["lastName" is not allowed to be empty]'
              Code.expect(TestUtils.isRespError(res, 422, 'Invalid Data', errMessage))
                .to.be.true()

              return callback(null)
            },
            function testPatientNotSavedInDb(callback) {
              Models.Patient.find({}, function(err, patients) {
                if (err) return callback(err)
                Code.expect(patients).to.have.length(0)

                return callback(null)
              })
            }
          ],
          function finish(err) {
            if (err) throw err

            return done()
          })
        })

        lab.test('Should return 422 if name is null.', (done) => {
          Async.waterfall([
            function fakePatientJSON(callback) {
              FakeFactories.patientFactory.create(
                1,
                null,
                callback
              )
            },
            function createPatient(patient, callback) {
              const payload = _.cloneDeep(patient.toJSON())
              delete payload.id
              delete payload._id
              payload.firstName = null

              const req = {
                method: 'POST',
                url: '/api/v1.0/patients',
                payload: payload
              }

              server.inject(req, res => callback(null, res, patient))
            },
            function testPatientNotUpdated(res, _patient, callback) {
              const errMessage = 'child "firstName" fails because ["firstName" must be a string]'
              Code.expect(TestUtils.isRespError(res, 422, 'Invalid Data', errMessage))
                .to.be.true()

              return callback(null)
            },
            function testPatientNotSavedInDb(callback) {
              Models.Patient.find({}, function(err, patients) {
                if (err) return callback(err)
                Code.expect(patients).to.have.length(0)

                return callback(null)
              })
            }
          ],
          function finish(err) {
            if (err) throw err

            return done()
          })
        })

        lab.test('Should return 422 if email is invalid.', (done) => {
          Async.waterfall([
            function fakePatientJSON(callback) {
              FakeFactories.patientFactory.create(
                1,
                null,
                callback
              )
            },
            function createPatient(patient, callback) {
              const payload = _.cloneDeep(patient.toJSON())
              delete payload.id
              delete payload._id
              payload.email = 'hi'

              const req = {
                method: 'POST',
                url: '/api/v1.0/patients',
                payload: payload
              }

              server.inject(req, res => callback(null, res, patient))
            },
            function testPatientNotUpdated(res, _patient, callback) {
              const errMessage = 'child "email" fails because ["email" must be a valid email]'
              Code.expect(TestUtils.isRespError(res, 422, 'Invalid Data', errMessage))
                .to.be.true()

              return callback(null)
            },
            function testPatientNotSavedInDb(callback) {
              Models.Patient.find({}, function(err, patients) {
                if (err) return callback(err)
                Code.expect(patients).to.have.length(0)

                return callback(null)
              })
            }
          ],
          function finish(err) {
            if (err) throw err

            return done()
          })
        })

        lab.test('Should return 422 if birthdate is too late.', (done) => {
          Async.waterfall([
            function fakePatientJSON(callback) {
              FakeFactories.patientFactory.create(
                1,
                null,
                callback
              )
            },
            function createPatient(patient, callback) {
              const payload = _.cloneDeep(patient.toJSON())
              delete payload.id
              delete payload._id
              payload.dob = new Date('1895-02-07')

              const req = {
                method: 'POST',
                url: '/api/v1.0/patients',
                payload: payload
              }

              server.inject(req, res => callback(null, res, patient))
            },
            function testPatientNotUpdated(res, _patient, callback) {
              const errMessage = 'Invalid DOB'
              Code.expect(TestUtils.isRespError(res, 422, 'Invalid Data', errMessage))
                .to.be.true()

              return callback(null)
            },
            function testPatientNotSavedInDb(callback) {
              Models.Patient.find({}, function(err, patients) {
                if (err) return callback(err)
                Code.expect(patients).to.have.length(0)

                return callback(null)
              })
            }
          ],
          function finish(err) {
            if (err) throw err

            return done()
          })
        })

        lab.test('Should return 422 if birthdate is in the future.', (done) => {
          Async.waterfall([
            function fakePatientJSON(callback) {
              FakeFactories.patientFactory.create(
                1,
                null,
                callback
              )
            },
            function createPatient(patient, callback) {
              const payload = _.cloneDeep(patient.toJSON())
              delete payload.id
              delete payload._id
              payload.dob = new Date('2031-02-07')

              const req = {
                method: 'POST',
                url: '/api/v1.0/patients',
                payload: payload
              }

              server.inject(req, res => callback(null, res, patient))
            },
            function testPatientNotUpdated(res, _patient, callback) {
              const errMessage = 'Invalid DOB'
              Code.expect(TestUtils.isRespError(res, 422, 'Invalid Data', errMessage))
                .to.be.true()

              return callback(null)
            },
            function testPatientNotSavedInDb(callback) {
              Models.Patient.find({}, function(err, patients) {
                if (err) return callback(err)
                Code.expect(patients).to.have.length(0)

                return callback(null)
              })
            }
          ],
          function finish(err) {
            if (err) throw err

            return done()
          })
        })

        lab.test('Should return 422 if phone number is too short.', (done) => {
          Async.waterfall([
            function fakePatientJSON(callback) {
              FakeFactories.patientFactory.create(
                1,
                null,
                callback
              )
            },
            function createPatient(patient, callback) {
              const payload = _.cloneDeep(patient.toJSON())
              delete payload.id
              delete payload._id
              payload.phones = [{
                type: 'Mobile',
                number: '1234567'
              }]

              const req = {
                method: 'POST',
                url: '/api/v1.0/patients',
                payload: payload
              }

              server.inject(req, res => callback(null, res, patient))
            },
            function testPatientNotUpdated(res, _patient, callback) {
              const errMessage = 'Phone Number Must be 10 Numeric Characters'
              Code.expect(TestUtils.isRespError(res, 422, 'Invalid Data', errMessage))
                .to.be.true()

              return callback(null)
            },
            function testPatientSavedInDb(callback) {
              Models.Patient.find({}, function(err, patients) {
                if (err) return callback(err)
                Code.expect(patients).to.have.length(0)

                return callback(null)
              })
            }
          ],
          function finish(err) {
            if (err) throw err

            return done()
          })
        })

        lab.test('Should return 422 if phone number contains non-numeric characters.', (done) => {
          Async.waterfall([
            function fakePatientJSON(callback) {
              FakeFactories.patientFactory.create(
                1,
                null,
                callback
              )
            },
            function createPatient(patient, callback) {
              const payload = _.cloneDeep(patient.toJSON())
              delete payload.id
              delete payload._id
              payload.phones = [{
                type: 'Mobile',
                number: '12-2221234'
              }]

              const req = {
                method: 'POST',
                url: '/api/v1.0/patients',
                payload: payload
              }

              server.inject(req, res => callback(null, res, patient))
            },
            function testPatientNotUpdated(res, _patient, callback) {
              const errMessage = 'Phone Number Must be 10 Numeric Characters'
              Code.expect(TestUtils.isRespError(res, 422, 'Invalid Data', errMessage))
                .to.be.true()

              return callback(null)
            },
            function testPatientSavedInDb(callback) {
              Models.Patient.find({}, function(err, patients) {
                if (err) return callback(err)
                Code.expect(patients).to.have.length(0)

                return callback(null)
              })
            }
          ],
          function finish(err) {
            if (err) throw err

            return done()
          })
        })
      })
    })

    lab.experiment('UPDATE tests', () => {
      lab.experiment('PUT tests', () => {
        lab.test('Should update patient document and return it.', (done) => {
          Async.waterfall([
            function fakePatient(callback) {
              FakeFactories.patientFactory.createAndSave(
                1,
                null,
                callback
              )
            },
            function updatePatient(patient, callback) {
              const payload = _.cloneDeep(patient.toJSON())
              payload.email = 'sophia@test.com'
              payload.lastName = 'johnson'

              const req = {
                method: 'PUT',
                url: `/api/v1.0/patients/${patient._id}`,
                payload: payload
              }

              server.inject(req, res => callback(null, res, patient))
            },
            function testPatientUpdated(res, _patient, callback) {
              Code.expect(TestUtils.isRespSuccess(res, 202)).to.be.true()

              const patient = res.result.data.patient

              Code.expect(patient.id).to.equal(_patient._id)
              Code.expect(patient.email).to.equal('sophia@test.com')
              Code.expect(patient.lastName).to.equal('johnson')
              _noPrivateFieldsInResponse(patient)

              return callback(null, patient)
            },
            function testPatientSavedInDb(_patient, callback) {
              Models.Patient.find({}, function(err, patients) {
                if (err) return callback(err)
                Code.expect(patients).to.have.length(1)

                const updatedPatient = patients[0]
                Code.expect(updatedPatient.email).to.equal('sophia@test.com')
                Code.expect(updatedPatient.lastName).to.equal('johnson')
                Code.expect(updatedPatient._id).to.equal(_patient._id)

                return callback(null)
              })
            }
          ],
          function finish(err) {
            if (err) throw err

            return done()
          })
        })

        lab.test('Should update nested properties.', (done) => {
          Async.waterfall([
            function fakePatient(callback) {
              FakeFactories.patientFactory.createAndSave(
                1,
                null,
                callback
              )
            },
            function updatePatient(patient, callback) {
              const payload = _.cloneDeep(patient.toJSON())
              payload.address.city = 'parisTest'

              const req = {
                method: 'PUT',
                url: `/api/v1.0/patients/${patient._id}`,
                payload: payload
              }

              server.inject(req, res => callback(null, res, patient))
            },
            function testPatientUpdated(res, _patient, callback) {
              Code.expect(TestUtils.isRespSuccess(res, 202)).to.be.true()

              const patient = res.result.data.patient

              Code.expect(patient.id).to.equal(_patient._id)
              Code.expect(patient.address.city).to.equal('parisTest')
              _noPrivateFieldsInResponse(patient)

              return callback(null, patient)
            },
            function testPatientSavedInDb(_patient, callback) {
              Models.Patient.find({}, function(err, patients) {
                if (err) return callback(err)
                Code.expect(patients).to.have.length(1)

                const updatedPatient = patients[0]
                Code.expect(updatedPatient.address.city).to.equal('parisTest')
                Code.expect(updatedPatient._id).to.equal(_patient._id)

                return callback(null)
              })
            }
          ],
          function finish(err) {
            if (err) throw err

            return done()
          })
        })

        lab.experiment('Error Handling', () => {

          lab.test('Should return 422 if attempting to set name as empty string.', (done) => {
            Async.waterfall([
              function fakePatient(callback) {
                FakeFactories.patientFactory.createAndSave(
                  1,
                  { lastName: 'Karim' },
                  callback
                )
              },
              function createPatients(patient, callback) {
                const payload = _.cloneDeep(patient.toJSON())
                payload.lastName = ''

                const req = {
                  method: 'PUT',
                  url: `/api/v1.0/patients/${patient._id}`,
                  payload: payload
                }

                server.inject(req, res => callback(null, res, patient))
              },
              function testPatientNotUpdated(res, _patient, callback) {
                const errMessage = 'child "lastName" fails because ["lastName" is not allowed to be empty]'
                Code.expect(TestUtils.isRespError(res, 422, 'Invalid Data', errMessage))
                  .to.be.true()

                return callback(null)
              },
              function testPatientSavedInDb(callback) {
                /* checks no new ones were created as well */
                Models.Patient.find({}, function(err, patients) {
                  if (err) return callback(err)
                  Code.expect(patients).to.have.length(1)

                  const updatedPatient = patients[0]
                  Code.expect(updatedPatient.lastName).to.equal('Karim')

                  return callback(null)
                })
              }
            ],
            function finish(err) {
              if (err) throw err

              return done()
            })
          })

          lab.test('Should return 422 if attempting to make name too long.', (done) => {
            Async.waterfall([
              function fakePatient(callback) {
                FakeFactories.patientFactory.createAndSave(
                  1,
                  { lastName: 'Karim' },
                  callback
                )
              },
              function createPatients(patient, callback) {
                const payload = _.cloneDeep(patient.toJSON())
                payload.lastName = Array(36).fill('a').join('')

                const req = {
                  method: 'PUT',
                  url: `/api/v1.0/patients/${patient._id}`,
                  payload: payload
                }

                server.inject(req, res => callback(null, res, patient))
              },
              function testPatientNotUpdated(res, _patient, callback) {
                const errMessage = 'child "lastName" fails because ["lastName" length must be less than or equal to 35 characters long]'
                Code.expect(TestUtils.isRespError(res, 422, 'Invalid Data', errMessage))
                  .to.be.true()

                return callback(null)
              },
              function testPatientSavedInDb(callback) {
                /* checks no new ones were created as well */
                Models.Patient.find({}, function(err, patients) {
                  if (err) return callback(err)
                  Code.expect(patients).to.have.length(1)

                  const updatedPatient = patients[0]
                  Code.expect(updatedPatient.lastName).to.equal('Karim')

                  return callback(null)
                })
              }
            ],
            function finish(err) {
              if (err) throw err

              return done()
            })
          })

          lab.test('Should return 422 if given an invalid email.', (done) => {
            Async.waterfall([
              function fakePatient(callback) {
                FakeFactories.patientFactory.createAndSave(
                  1,
                  { email: 'test@test.com' },
                  callback
                )
              },
              function createPatients(patient, callback) {
                const payload = _.cloneDeep(patient.toJSON())
                payload.email = 'hi'

                const req = {
                  method: 'PUT',
                  url: `/api/v1.0/patients/${patient._id}`,
                  payload: payload
                }

                server.inject(req, res => callback(null, res, patient))
              },
              function testPatientNotUpdated(res, _patient, callback) {
                const errMessage = 'child "email" fails because ["email" must be a valid email]'
                Code.expect(TestUtils.isRespError(res, 422, 'Invalid Data', errMessage))
                  .to.be.true()

                return callback(null)
              },
              function testPatientNotSavedInDb(callback) {
                /* checks no new ones were created as well */
                Models.Patient.find({}, function(err, patients) {
                  if (err) return callback(err)
                  Code.expect(patients).to.have.length(1)

                  const updatedPatient = patients[0]
                  Code.expect(updatedPatient.email).to.equal('test@test.com')

                  return callback(null)
                })
              }
            ],
            function finish(err) {
              if (err) throw err

              return done()
            })
          })

          lab.test('Should return 422 if birthdate is too late.', (done) => {
            Async.waterfall([
              function fakePatient(callback) {
                FakeFactories.patientFactory.createAndSave(
                  1,
                  null,
                  callback
                )
              },
              function attemptToUpdatePatient(patient, callback) {
                const payload = _.cloneDeep(patient.toJSON())
                payload.dob = new Date('1895-02-07')

                const req = {
                  method: 'PUT',
                  url: `/api/v1.0/patients/${patient._id}`,
                  payload: payload
                }

                server.inject(req, res => callback(null, res, patient))
              },
              function testPatientNotUpdated(res, _patient, callback) {
                const errMessage = 'Invalid DOB'
                Code.expect(TestUtils.isRespError(res, 422, 'Invalid Data', errMessage))
                  .to.be.true()

                return callback(null, _patient)
              },
              function testPatientNotSavedInDb(_patient, callback) {
                /* checks no new ones were created as well */
                Models.Patient.find({}, function(err, patients) {
                  if (err) return callback(err)
                  Code.expect(patients).to.have.length(1)

                  const updatedPatient = patients[0]
                  Code.expect(updatedPatient.dob).to.equal(_patient.dob)

                  return callback(null)
                })
              }
            ],
            function finish(err) {
              if (err) throw err

              return done()
            })
          })

          lab.test('Should return 422 if birthdate is in the future.', (done) => {
            Async.waterfall([
              function fakePatient(callback) {
                FakeFactories.patientFactory.createAndSave(
                  1,
                  null,
                  callback
                )
              },
              function attemptToUpdatePatient(patient, callback) {
                const payload = _.cloneDeep(patient.toJSON())
                payload.dob = new Date('2031-02-07')

                const req = {
                  method: 'PUT',
                  url: `/api/v1.0/patients/${patient._id}`,
                  payload: payload
                }


                server.inject(req, res => callback(null, res, patient))
              },
              function testPatientNotUpdated(res, _patient, callback) {
                const errMessage = 'Invalid DOB'
                Code.expect(TestUtils.isRespError(res, 422, 'Invalid Data', errMessage))
                  .to.be.true()

                return callback(null, _patient)
              },
              function testPatientNotSavedInDb(_patient, callback) {
                /* checks no new ones were created as well */
                Models.Patient.find({}, function(err, patients) {
                  if (err) return callback(err)
                  Code.expect(patients).to.have.length(1)

                  const updatedPatient = patients[0]
                  Code.expect(updatedPatient.dob).to.equal(_patient.dob)

                  return callback(null)
                })
              }
            ],
            function finish(err) {
              if (err) throw err

              return done()
            })
          })

          lab.test('Should return 422 if phone number is too short.', (done) => {
            Async.waterfall([
              function fakePatient(callback) {
                FakeFactories.patientFactory.createAndSave(
                  1,
                  null,
                  callback
                )
              },
              function updatePatient(patient, callback) {
                const payload = _.cloneDeep(patient.toJSON())
                payload.phones = [{
                  type: 'Mobile',
                  number: '1234567'
                }]

                const req = {
                  method: 'PUT',
                  url: `/api/v1.0/patients/${patient._id}`,
                  payload: payload
                }

                server.inject(req, res => callback(null, res, patient))
              },
              function testPatientNotUpdated(res, _patient, callback) {
                const errMessage = 'Phone Number Must be 10 Numeric Characters'
                Code.expect(TestUtils.isRespError(res, 422, 'Invalid Data', errMessage))
                  .to.be.true()

                return callback(null)
              },
              function testPatientSavedInDb(callback) {
                /* checks no new ones were created as well */
                Models.Patient.find({}, function(err, patients) {
                  if (err) return callback(err)
                  Code.expect(patients).to.have.length(1)

                  patients[0].phones.forEach((phone) => {
                    Code.expect(phone.number).to.not.equal('1234567')
                    Code.expect(phone.number).to.have.length(10)
                  })
                  return callback(null)
                })
              }
            ],
            function finish(err) {
              if (err) throw err

              return done()
            })
          })

          lab.test('Should return 422 if phone number contains non-numeric characters.', (done) => {
            Async.waterfall([
              function fakePatient(callback) {
                FakeFactories.patientFactory.createAndSave(
                  1,
                  null,
                  callback
                )
              },
              function updatePatient(patient, callback) {
                const payload = _.cloneDeep(patient.toJSON())
                payload.phones = [{
                  type: 'Mobile',
                  number: '12-2221234'
                }]

                const req = {
                  method: 'PUT',
                  url: `/api/v1.0/patients/${patient._id}`,
                  payload: payload
                }

                server.inject(req, res => callback(null, res, patient))
              },
              function testPatientNotUpdated(res, _patient, callback) {
                const errMessage = 'Phone Number Must be 10 Numeric Characters'
                Code.expect(TestUtils.isRespError(res, 422, 'Invalid Data', errMessage))
                  .to.be.true()

                return callback(null)
              },
              function testPatientSavedInDb(callback) {
                /* checks no new ones were created as well */
                Models.Patient.find({}, function(err, patients) {
                  if (err) return callback(err)
                  Code.expect(patients).to.have.length(1)

                  patients[0].phones.forEach((phone) => {
                    Code.expect(phone.number).to.not.equal('12-2221234')
                    Code.expect(phone.number).to.have.length(10)
                  })
                  return callback(null)
                })
              }
            ],
            function finish(err) {
              if (err) throw err

              return done()
            })
          })

          lab.test('Should return 404 if not patient with the given id exists.', (done) => {
            Async.waterfall([
              function fakePatientJSON(callback) {
                FakeFactories.patientFactory.create(
                  1,
                  null,
                  callback
                )
              },
              function updatePatient(patient, callback) {
                const payload = _.cloneDeep(patient.toJSON())
                payload.email = 'sophia@test.com'
                payload.lastName = 'johnson'

                const req = {
                  method: 'PUT',
                  url: `/api/v1.0/patients/${notFoundTestId}`,
                  payload: payload
                }

                server.inject(req, res => callback(null, res, patient))
              },
              function test404Returned(res, _patient, callback) {
                Code.expect(TestUtils.isRespError(res, 404, 'Not Found'))
                  .to.be.true()
                return callback(null)
              },
              function testPatientNotSavedInDb(callback) {
                Models.Patient.find({}, function(err, patients) {
                  if (err) return callback(err)
                  Code.expect(patients).to.have.length(0)

                  return callback(null)
                })
              }
            ],
            function finish(err) {
              if (err) throw err

              return done()
            })
          })

          lab.test('Should return 422 if bad id is given.', (done) => {
            Async.waterfall([
              function fakePatientJSON(callback) {
                FakeFactories.patientFactory.create(
                  1,
                  null,
                  callback
                )
              },
              function updatePatient(patient, callback) {
                const payload = _.cloneDeep(patient.toJSON())
                payload.email = 'sophia@test.com'
                payload.lastName = 'johnson'

                const req = {
                  method: 'PUT',
                  url: '/api/v1.0/patients/AAA',
                  payload: payload
                }

                server.inject(req, res => callback(null, res, patient))
              },
              function test422Returned(res, _patient, callback) {
                Code.expect(TestUtils.isRespError(res, 422, 'Invalid Data'))
                  .to.be.true()
                return callback(null)
              },
              function testPatientNotSavedInDb(callback) {
                Models.Patient.find({}, function(err, patients) {
                  if (err) return callback(err)
                  Code.expect(patients).to.have.length(0)

                  return callback(null)
                })
              }
            ],
            function finish(err) {
              if (err) throw err

              return done()
            })
          })
        })
      })

      lab.experiment('PATCH tests', () => {
        /* Test cases duplicate fields */
        lab.test('Should update patient document and return it.', (done) => {
          Async.waterfall([
            function fakePatientJSON(callback) {
              FakeFactories.patientFactory.createAndSave(
                1,
                null,
                callback
              )
            },
            function updatePatient(patient, callback) {
              const req = {
                method: 'PATCH',
                url: `/api/v1.0/patients/${patient._id}`,
                payload: [{
                  op: 'replace',
                  path: 'email',
                  value: 'sophia@test.com'
                },
                {
                  op: 'replace',
                  path: 'lastName',
                  value: 'johnson'
                }]
              }

              server.inject(req, res => callback(null, res, patient))
            },
            function testPatientUpdated(res, _patient, callback) {
              Code.expect(TestUtils.isRespSuccess(res, 202)).to.be.true()

              const patient = res.result.data.patient
              Code.expect(patient.id).to.equal(_patient._id)
              Code.expect(patient.email).to.equal('sophia@test.com')
              Code.expect(patient.lastName).to.equal('johnson')
              _noPrivateFieldsInResponse(patient)

              return callback(null, patient)
            },
            function testPatientSavedInDb(_patient, callback) {
              Models.Patient.findById(_patient._id, function(err, updatedPatient) {
                if (err) return callback(err)
                Code.expect(updatedPatient.email).to.equal('sophia@test.com')
                Code.expect(updatedPatient.lastName).to.equal('johnson')

                return callback(null)
              })
            }
          ],
          function finish(err) {
            if (err) throw err

            return done()
          })
        })

        lab.test.skip('Should update nested fields on patient document.', (done) => {
          Async.waterfall([
            function fakePatientJSON(callback) {
              FakeFactories.patientFactory.createAndSave(
                1,
                null,
                callback
              )
            },
            function updatePatient(patient, callback) {
              const req = {
                method: 'PATCH',
                url: `/api/v1.0/patients/${patient._id}`,
                payload: [
                  {
                    op: 'replace',
                    path: 'address.city',
                    value: 'paris'
                  }
                ]
              }

              server.inject(req, res => callback(null, res, patient))
            },
            function testPatientUpdated(res, _patient, callback) {
              Code.expect(TestUtils.isRespSuccess(res, 202)).to.be.true()

              const patient = res.result.data.patient
              Code.expect(patient.id).to.equal(_patient._id)
              Code.expect(patient.address.city).to.equal('paris')
              _noPrivateFieldsInResponse(patient)

              return callback(null, patient)
            },
            function testPatientSavedInDb(_patient, callback) {
              Models.Patient.findById(_patient._id, function(err, updatedPatient) {
                if (err) return callback(err)
                Code.expect(updatedPatient.address.city).to.equal('paris')

                return callback(null)
              })
            }
          ],
          function finish(err) {
            if (err) throw err

            return done()
          })
        })

        /* Skipped in the interest of time. */
        lab.test.skip('Should remove items from subarray by index.', (done) => {
          Async.waterfall([
            function fakePatientJSON(callback) {
              FakeFactories.patientFactory.createAndSave(
                1,
                {
                  phones: [{
                    type: 'Mobile',
                    number: '918 450 1690'
                  },
                  {
                    type: 'Mobile',
                    number: '918 450 1680'
                  },
                  {
                    type: 'Mobile',
                    number: '918 490 1680'
                  }]
                },
                callback
              )
            },
            function updatePatient(patient, callback) {
              const req = {
                method: 'PATCH',
                url: `/api/v1.0/patients/${patient._id}`,
                payload: [
                  {
                    op: 'remove',
                    path: 'phones.1'
                  }
                ]
              }

              server.inject(req, res => callback(null, res, patient))
            },
            function testPatientUpdated(res, _patient, callback) {
              Code.expect(TestUtils.isRespSuccess(res, 202)).to.be.true()

              const patient = res.result.data.patient
              Code.expect(patient.id).to.equal(_patient._id)
              _noPrivateFieldsInResponse(patient)

              return callback(null, patient)
            },
            function testPatientSavedInDb(_patient, callback) {
              Models.Patient.findById(_patient._id, function(err, updatedPatient) {
                if (err) return callback(err)
                Code.expect(updatedPatient.phones).to.have.length(2)

                const deletedNumber = '918 450 1680'
                updatedPatient.phones.forEach((phone) => {
                  Code.expect(phone.number).to.not.equal(deletedNumber)
                })

                return callback(null)
              })
            }
          ],
          function finish(err) {
            if (err) throw err

            return done()
          })
        })

        lab.experiment('Error Handling', () => {

          lab.test('Should return 404 if not patient with the given id exists.', (done) => {
            Async.waterfall([
              function fakePatientJSON(callback) {
                FakeFactories.patientFactory.create(
                  1,
                  null,
                  callback
                )
              },
              function updatePatient(patient, callback) {
                const req = {
                  method: 'PATCH',
                  url: `/api/v1.0/patients/${notFoundTestId}`,
                  payload: [{
                    op: 'replace',
                    path: 'email',
                    value: 'sophia@test.com'
                  },
                  {
                    op: 'replace',
                    path: 'lastName',
                    value: 'johnson'
                  }]
                }

                server.inject(req, res => callback(null, res, patient))
              },
              function test404Returned(res, _patient, callback) {
                Code.expect(TestUtils.isRespError(res, 404, 'Not Found'))
                  .to.be.true()
                return callback(null)
              },
              function testPatientNotSavedInDb(callback) {
                Models.Patient.find({}, function(err, patients) {
                  if (err) return callback(err)
                  Code.expect(patients).to.have.length(0)

                  return callback(null)
                })
              }
            ],
            function finish(err) {
              if (err) throw err

              return done()
            })
          })

          lab.test('Should return 422 if id is missing or not valid.', (done) => {
            Async.waterfall([
              function fakePatientJSON(callback) {
                FakeFactories.patientFactory.create(
                  1,
                  null,
                  callback
                )
              },
              function updatePatient(patient, callback) {
                const req = {
                  method: 'PATCH',
                  url: '/api/v1.0/patients/AAA',
                  payload: [{
                    op: 'replace',
                    path: 'email',
                    value: 'sophia@test.com'
                  }]
                }

                server.inject(req, res => callback(null, res, patient))
              },
              function test422Returned(res, _patient, callback) {
                Code.expect(TestUtils.isRespError(res, 422, 'Invalid Data'))
                  .to.be.true()
                return callback(null)
              },
              function testPatientNotSavedInDb(callback) {
                Models.Patient.find({}, function(err, patients) {
                  if (err) return callback(err)
                  Code.expect(patients).to.have.length(0)

                  return callback(null)
                })
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

    lab.experiment('DELETE tests', () => {
      lab.test('Should delete a patient document and return 204.', (done) => {
        Async.waterfall([
          function fakePatients(callback) {
            FakeFactories.patientFactory.createAndSave(
              3,
              null,
              callback
            )
          },
          function fakePatientToRemove(patients, callback) {
            FakeFactories.patientFactory.createAndSave(
              1,
              null,
              callback
            )
          },
          function createPatients(patient, callback) {
            const req = {
              method: 'DELETE',
              url: `/api/v1.0/patients/${patient._id}`
            }

            server.inject(req, res => callback(null, res))
          },
          function testSuccessResponse(res, callback) {
            Code.expect(TestUtils.isRespSuccess(res, 204)).to.be.true()
            return callback(null)
          },
          function testPatientRemovedFromDb(callback) {
            Models.Patient.find({}, function(err, patients) {
              if (err) return callback(err)
              Code.expect(patients).to.have.length(3)
              return callback(null)
            })
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

/**
 * Checks the patient doc object in the response
 * doesn't contain any Mongo keys like __v.
 *
 * @param { Object } - The patient doc object.
 */
function _noPrivateFieldsInResponse(patient) {
  Code.expect(patient.__v).to.be.undefined()
  /* Test no nested docs have _id or id */
  Code.expect(patient.address._id).to.be.undefined()
  Code.expect(patient.address.__v).to.be.undefined()
  const phone = patient.phones[0]
  Code.expect(phone._id).to.be.undefined()
  Code.expect(phone.__v).to.be.undefined()
}
