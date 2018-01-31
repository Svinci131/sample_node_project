/*eslint-disable no-unused-vars*/

'use strict'

const Boom = require('boom')
const Joi = require('joi')

/**
 * Controller validation common to the DELETE method requests or
 * GET requests looking up a resource by its ID.
 */
module.exports.getDelIdValidation = {
  params: {
    id: Joi.string().hex().length(24)
  },
  failAction: function(request, reply, source, error) {
    return reply.error(Boom.notFound())
  }
}
