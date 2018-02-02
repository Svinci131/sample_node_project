/* eslint no-unused-vars: off, no-console: off */

const Boom = require('boom')
const Code = require('code')
const Lab = require('lab')
const Path = require('path')
const TestUtils = require('../test_utils')

const lab = exports.lab = Lab.script()

let mongoose
let server

lab.experiment('core/utils module tests', () => {

  lab.before((done) => {
    const onServerReady = function(_server, _mongoose) {
      server = _server
      return done()
    }

    TestUtils.setupServer(false, onServerReady)
  })

  lab.after((done) => {
    TestUtils.tearDownServer(null, done)
  })

  lab.experiment('core/utils tests', () => {

    const Utils = require('../../lib/modules/core/utils')

    lab.experiment('packageValidationErrors() tests', () => {

      lab.test('should return empty error object if no errors found.',
        (done) => {
          Code.expect(Utils.packageValidationErrors([])).to.equal([])
          return done()
        }
      )

      lab.test('should return packaged errors object if errors found.',
        (done) => {
          const errors = [
            { message: '"name" is too short', path: 'name', randomProp: true },
            { message: '"age" is too small', path: 'age', randomProp: false }
          ]

          Code.expect(Utils.packageValidationErrors(errors)).to.equal([
            { message: '"name" is too short', path: 'name' },
            { message: '"age" is too small', path: 'age' }
          ])
          return done()
        }
      )

    })

    lab.experiment('createSuccessRespPayload() tests', () => {

      lab.test('should return expected payload', (done) => {
        Code.expect(Utils.createSuccessRespPayload({ a: 'b' })).to.equal({
          status: 'success',
          data: { a: 'b' }
        })

        done()
      })

    })

    lab.experiment('createErrorRespPayload() tests', () => {

      lab.test('should return expected payload without data', (done) => {
        Code.expect(Utils.createErrorRespPayload(
          Boom.create(400, 'Wrong parameter'))
        ).to.equal({
          status: 'error',
          error: 'Wrong parameter'
        })
        done()
      })

      lab.test('should return expected payload with data', (done) => {
        Code.expect(Utils.createErrorRespPayload(
          Boom.create(400, 'Wrong parameter', { details: 'content' }))
        ).to.equal({
          status: 'error',
          error: 'Wrong parameter',
          data: { details: 'content' }
        })
        done()
      })

    })

    lab.experiment('pathExists() tests', () => {

      lab.test('should return false if the path does not exist', (done) => {
        Code.expect(Utils.pathExists('/non-existing/path')).to.be.false()
        return done()
      })

      lab.test('should return true if the path exists', (done) => {
        // file
        Code.expect(Utils.pathExists(
          Path.join(__dirname, 'path_exists', '.gitkeep'))).to.be.true()
        // folder
        Code.expect(Utils.pathExists(
          Path.join(__dirname, 'path_exists'))).to.be.true()
        return done()
      })

      lab.test('should return false if no path provided', (done) => {
        Code.expect(Utils.pathExists()).to.be.false()
        return done()
      })

    })

  })

})
