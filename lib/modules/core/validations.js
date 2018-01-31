/* eslint-disable no-unused-vars */

const Boom = require('boom')
const Models = require('./models')
const Joi = require('joi')

Joi.objectId = require('joi-objectid')(Joi)

/**
 * Controller validation common to the DELETE method requests or
 * GET requests looking up a resource by its ID.
 */
module.exports.getDelIdValidation = {
  params: {
    id: Joi.objectId()
  },
  failAction: function(request, reply, source, error) {
    return reply.error(Boom.badData('Invalid Data'))
  }
}


module.exports.patchPatientValidation = {
  params: {
    id: Joi.objectId()
  },
  failAction: function(request, reply, source, error) {
    return reply.error(Boom.badData('Invalid Data'))
  }
}

module.exports.putPatientValidation = {
  params: {
    id: Joi.objectId()
  },
  payload: Models.Patient.validationSchema,
  failAction: function(request, reply, source, error) {
    return reply.error(Boom.badData('Invalid Data', error.message))
  }
}
