/* eslint no-unused-vars: off, no-console: off */

'use strict'

const Async = require('async')
const Config = require('config')
const Glue = require('glue')
const Mongoose = require('../lib/modules/mongoose')
const Path = require('path')

require('events').EventEmitter.defaultMaxListeners = Infinity

/**
 * Creates a Node.js hapi server for testing purposes and returns
 * the server object and mongoose connection object.
 *
 * @param {boolean} useDb - If true, connect to the DB and drop its content.
 * @param {callback} done - Callback(server, mongoose).
 */
module.exports.setupServer = function(useDb, done) {
  Async.waterfall([
    function openDbConnection(callback) {
      if (useDb) {
        Mongoose.openConnection(
          Config.get('database.connection_string'),
          callback
        )
      }
      else {
        return callback(null, null)
      }
    },
    function dropDb(mongoose, callback) {
      if (mongoose !== null) {
        mongoose.connection.db.dropDatabase((err, res) => {
          console.log('Test database dropped')
          return callback(err, mongoose)
        })
      }
      else {
        return callback(null, null)
      }
    },
    function startServer(mongoose, callback) {
      const manifest = Config.get('glue_manifest')
      const glueOptions = {
        relativeTo: Path.join(__dirname, '..', 'lib', 'modules')
      }
      Glue.compose(manifest, glueOptions, (err, _server) => {
        return callback(err, _server, mongoose)
      })
    }
  ],
  (err, server, mongoose) => {
    if (err) throw err

    return done(server, mongoose)
  })
}

/**
 * Drops the test database. The `dbConnection` argument is the
 * mongoose.connection object. When done, onComplete is called.
 *
 * @param {Object} db - The database object.
 * @param {callback} callback - The callback(err, result)
 */
module.exports.dropTestDatabase = function(db, onComplete) {
  db.db.dropDatabase(onComplete)
}

/**
 * Closes the given mongoose database connection.
 *
 * @param {Object} db - The database object.
 * @param {callback} callback - The callback(err, result)
 */
module.exports.tearDownServer = function(db, onComplete) {
  if (db !== null) {
    if (db.connection.readyState) {
      db.connection.close()
    }

    db.connection.once('close', () => {
      console.log('Test database connection closed')
      db.disconnect()
      console.log('Test database disconnected')

      return onComplete()
    })
  }
  else {
    return onComplete()
  }
}

/**
 * Returns true if the response is successful, false otherwise.
 *
 * @param {Response} resp - The response object.
 * @param {int} statusCode - The expected response status code.
 * @returns {boolean} - True if the response is successful, false otherwise.
 */
module.exports.isRespSuccess = function(resp, statusCode) {
  // No payload for 204 response.
  if (resp.statusCode === statusCode && statusCode === 204) {
    return true
  }

  return resp.statusCode === statusCode && resp.result.status === 'success'
}

/**
 * Returns true if the response is erroneous, false otherwise. Set errData
 * to null or undefined if you want to skip the argument.
 *
 * @param {Response} resp - The response object.
 * @param {int} statusCode - The expected response status code.
 * @param {string} errMessage - The message property content.
 * @param {object} errData - The data property content.
 * @returns {boolean} - True if the response is erroneous, false otherwise.
 */
module.exports.isRespError = function(resp, statusCode, errMessage, errData) {
  return resp.statusCode === statusCode &&
    resp.result.status === 'error' &&
    resp.result.error === errMessage &&
    (
      errData === undefined || errData === null ||
      JSON.stringify(resp.result.data) === JSON.stringify(errData)
    )
}
