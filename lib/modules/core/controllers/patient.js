const _ = require('lodash')
const Boom = require('boom')
const DbUtils = require('../db_utils')
const Utils = require('../utils')
const Models = require('../models')
const Validations = require('../validations')

//TODO REMOVE GROOMQUERY?, REMOVE HAPI SWAGGERED STUFF
//TOJSON RESEARCH TOO SLOW?

/**
 * Builds the filter criteria for databases searches.
 *
 * @params {Request} request - The reuest object.
 * @returns {Object} - The database query criteria specifying object.
 */
const buildQueryFilter = function(request) {
  const crit = {}

  //TODO update
  if (request.query.status !== undefined) {
    crit.status = request.query.status
  }

  return crit
}

exports.get = {

  id: 'getV10Patient',

  description: 'Returns one patient',


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

      /* Helper function I use to apply global params such as sort */
      const patient = await DbUtils.groomQuery(
        Models.Patient.findById(id),
        request
      ).exec()

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

exports.post = {

  id: 'postV10Patients',

  description: 'Creates a new patient',

  plugins: {
    'hapi-swaggered': {
      operationId: 'postV10Patients'
    }
  },

  // validate: Validations.getDelIdValidation,

  tags: ['api'],

  handler: async function(request, reply) {
    try {
      const patient = await new Models.Patient(request.payload)
      await patient.save()

      return reply.success(200, { patient: patient.toJSON() })
    } catch (err) {
      return reply.error(Boom.wrap(err))
    }
  }
}

/**
 * PUT vs. PATCH
 *
 * For me whether to use put or patch depends on
 * the needs of the front end. If it's a document with
 * few nested keys that's mainly updated by a form view
 * with a save button then it may make sense to use PUT.
 * However that there are a number of subfields or children
 * that need to be added to an array, it can be messy for
 * the front end to update all those nested fields.
 * So I like to to do both.
*/

exports.put = {

  // validate: Validations.getDelIdValidation,

  handler: function(request, reply) {
    try {
      console.log('payload', request.payload)
      Models.Patient.findOneAndUpdate(
        { _id: request.params.id },
        request.payload,
        { new: true },
        (err, patient) => {
          if (err) return reply.error(Boom.wrap(err))
          if (!patient) return reply.error(Boom.notFound())

          return reply.success(202, { patient: patient.toJSON() })
        }
      )
    } catch (err) {
      return reply.error(Boom.wrap(err))
    }
  }
}

/**
 * Ref: http://williamdurand.fr/2014/02/14/please-do-not-patch-like-an-idiot/
 *
 * ex. [
 *      { "op": "remove", "path": "a" },
 *      { "op": "add", "path": "a", "value": [ "foo", "bar" ] },
 *      { "op": "replace", "path": "a", "value": 42 }
 *  ]
 */
exports.patch = {

  id: 'patchV10Patients',

  description: 'Updates one field on patient',

  plugins: {
    'hapi-swaggered': {
      operationId: 'patchV10Patient'
    }
  },

  validate: Validations.patchPatientValidation,

  tags: ['api'],

  handler: async function(request, reply) {
    try {
      const id = request.params.id
      const updates = request.payload

      const patient = await Models.Patient.findById(id).exec()
      if (!patient) return reply.error(Boom.notFound())
      const updatedPatient = await _updatePatient(patient, updates)

      return reply.success(202, { patient: updatedPatient.toJSON() })
    } catch (err) {
      return reply.error(Boom.wrap(err))
    }
  }
}

/**
 * Updates multiple fields on a patient doc.
 */
async function _updatePatient(patient, data) {
  const ops = {
    replace: function(patient, d) {
      _.set(patient, d.path, d.value)
    }
  }

  data.forEach((d) => {
    const operation = ops[d.op]
    operation(patient, d)
  })

  return patient.save(patient)
}
