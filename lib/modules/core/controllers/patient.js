'use strict'

const Boom = require('boom')
const DbUtils = require('../db_utils')
const Utils = require('../utils')
const Models = require('../models')
const Validations = require('../validations')


/**
 * Builds the filter criteria for databases searches.
 *
 * @params {Request} request - The reuest object.
 * @returns {Object} - The database query criteria specifying object.
 */
var buildQueryFilter = function(request) {
  let crit = {}

  if (request.query.status !== undefined) {
    crit['status'] = request.query.status
  }

  return crit
}

exports.get = {

  id: 'getV10Patient',

  description: 'Returns one patient',

  notes: 'Implementation notes.',

  plugins: {
    'hapi-swaggered': {
      operationId: 'getV10Patient'
    }
  },

  validate: Validations.getDelIdValidation,

  tags: ['api'],

  handler: async function(request, reply) {
    try {
      const id = request.params.id
      console.log(id)
      const patient = await Models.Patient.findById(id).exec()

      if (!patient) return reply.error(Boom.notFound())
      return reply.success(200, { patient })
    } catch (err) {
      return reply.error(Boom.wrap(err))
    }
  }

}

exports.list = {

  id: 'getV10Patients',

  description: 'Returns an array of patients',

  notes: 'Implementation notes.',

  plugins: {
    'hapi-swaggered': {
      operationId: 'getV10Patients'
    }
  },

  // validate: Validations.getDelIdValidation,

  tags: ['api'],

  handler: async function(request, reply) {
    try {
      const filter = buildQueryFilter(request)
      const patients = await DbUtils.groomQuery(
        Models.Patient.find(filter),
        request
      ).exec()

      return reply.success(200, { patients })
    } catch (err) {
      return reply.error(Boom.wrap(err))
    }
  }

}
