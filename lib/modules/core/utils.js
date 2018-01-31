'use strict'

const Fs = require('fs')

module.exports = {
  getNestedValue: function(obj, path) {
    let keys = path.split('.')
    let val  = obj
    let key

    while (keys.length > 0) {
      key = keys.shift()
      val = val[key]
    }

    let res = {}
    res[key] = val
    return res
  },
  /**
   * Reassembles the errors into an array of objects containing only the error
   * properties that are of interest, e.g.:
   *
   * [
   *   {
   *     message: 'The Author name field cannot be longer than 50 characters',
   *     path: 'Author'
   *   }
   * ]
   *
   * @param {array} errors - Array of validation error messages.
   * @return {array} - Array of errors containing only desired fields.
   */
  packageValidationErrors: function(errors) {
    var errorsPackage = []

    errors.forEach((err) => {
      errorsPackage.push({
        'message': err.message,
        'path': err.path
      })
    })

    return errorsPackage
  },

  /**
   * Wraps the `data` payload object in a JSON response format suitable for
   * sending back to the browser as a response.
   *
   * @param {object} data - The data payload object to send in the response.
   * @return {object} - The response JSON containing the payload.
   */
  createSuccessRespPayload: function(data) {
    return {
      'status': 'success',
      'data': data
    }
  },

  /**
   * Wraps the error response in a JSON format suitable for sending back to
   * the browser as a response.
   *
   * @param {object} err - The error message to send back in a response.
   * @return {object} - The response JSON containing the error.
   */
  createErrorRespPayload: function(err) {
    var payload = {
      'status': 'error',
      'error': err.message // || err.output.payload.error
    }

    if (err.data !== null) {
      payload.data = err.data
    }

    return payload
  },

  /**
   * Returns true if the path exists, false otherwise.
   *
   * @param {string} path - The path to check
   * @return {boolean} - True if the path is found, false otherwise.
   */
  pathExists: function(path) {
    try {
      Fs.accessSync(path, Fs.F_OK | Fs.R_OK)
    }
    catch (e) {
      return false
    }

    return true
  }

}
