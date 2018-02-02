const Boom = require('boom')
const Config = require('config')
const Models = require('./models')
const Joi = require('joi')

const maxPageLimit = Config.get('app.max_page_limit')
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

module.exports.listValidation = {
  query: Joi.object({
    sort: Joi.string().min(1).max(255),
    offset: Joi.number(),
    pageLimit: Joi.number().min(1).max(maxPageLimit),
    count: Joi.boolean(),
    expand: Joi.string(),
  }).options({ allowUnknown: true })
}
