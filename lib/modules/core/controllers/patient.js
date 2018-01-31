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

/* Creates a reusable callback function
 *
 * @params {String} name - Default key to use
 * @returns {function} - Get Response function
 */
var createGetResponse = function(name) {
  const mainKey = name
  return function(err, obj, reply, status, keys) {
    if (err) {
      return reply.error(Boom.wrap(err, 400))
    }
    if (obj) {
      let data = {}
      if (keys) data = Utils.getNestedValue(obj, keys)
      else data[mainKey] = obj
      return reply.success(status, data)
    }
    return reply.error(Boom.notFound())
  }
}

/**
 * Reusable callback function for db query
 * Sends an error if the query returned an err or there was no robot found.
 * Otherwise it sends back the robot object or a property of the robot object
 * - Replaces:
 *
 * Models.Robot.findOne(
 *     { uniqueField: 'test' },
 *     (err, robot) => {
 *       if (err) return reply.error(Boom.wrap(err))
 *       if (robot) return reply.success(200, {number: 'nestedSchema.number'})
 *       return reply.error(Boom.notFound())
 *     }
 *   )
 *
 * @params {Err} err - The err object or null
 * @params {Object} robot - The robot returned by the dbquery
 * @params {Reply}  reply - Hapi's reply object
 * @params {Number} status - The success code to send
 * @params {String} Key - optional robot prop to send instead of the whole obj
 * @returns {Object} reply - Hai reply
 */
var getResponse = createGetResponse('example')


exports.get = {

  id: 'getV10Patient',

  description: 'Returns one patient',

  notes: 'Implementation notes.',

  plugins: {
    'hapi-swaggered': {
      operationId: 'getV10PatientNested'
    }
  },

  // validate: Validations.getDelIdValidation,

  tags: ['api'],

  handler: function(request, reply) {
    Models.Example.findOne(
      { uniqueField: 'test' },
      (err, example) => getResponse(err, example, reply, 200, 'nestedSchema.number')
    )
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
