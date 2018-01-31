'use strict'

const Boom = require('boom')
const Utils = require('./utils')

module.exports = {

  register: function(server) {
    server.decorate('reply', 'success', success)
    server.decorate('reply', 'error', error)

    /** If the response contains validation errors, wrap them in
     * the desired format. */
    server.ext('onPreResponse', function(request, reply) {
      var response = request.response

      if (response.isBoom && response.data !== null &&
          response.data.name === 'ValidationError') {
        response.output.payload = Utils.createErrorRespPayload(
          Boom.badData(
            'Invalid Data',
            Utils.packageValidationErrors(response.data.details)
          )
        )
      }

      return reply.continue()
    })
  }

}

/**
 * Decorates the reply() function wrapping a successful response in
 * the desired format.
 *
 * @param {code} - The response status code.
 * @param {data} - The data payload attached to the response.
 * @return {Response}
 */
function success(code, data) {
  var resp = this.response(Utils.createSuccessRespPayload(data))

  if (code !== null && code !== undefined) {
    resp.statusCode = code
  }

  return resp
}

/**
 * Decorates the reply() function wrapping an error response in
 * the desired format.
 *
 * @param {err} - The reponse error.
 * @return {Response}
 */
function error(err) {
  var resp = this.response(Utils.createErrorRespPayload(err))

  resp.statusCode = err.output.statusCode

  return resp
}
