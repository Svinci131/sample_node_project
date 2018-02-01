const _ = require('lodash')
const Boom = require('boom')
const Config = require('config')
const DbUtils = require('../db_utils')
const Models = require('../models')
const Validations = require('../validations')

/* Performance Notes: (Mongoose)
 * (mainly for future improvements)
 *
 * https://hashnode.com/post/why-are-mongoose-mongodb-odm-lean-queries-faster-than-normal-queries-cillvawhq0062kj53asxoyn7j
 * http://mongoosejs.com/docs/api.html#query_Query-lean
 * https://codeandcodes.com/2014/07/31/mongodb-performance-enhancements-and-tweaks/
 */

/* Notes on Async/Await:
 *
 * "The fundamental difference between await
 * and vanilla promises is that await X()
 * suspends execution of the current function,
 * while promise.then(X) continues execution
 * of the current function after adding the X call
 * to the callback chain."
 *
 * https://mathiasbynens.be/notes/async-stack-traces
 *
 * Note: In my research using async/await does not negatively
 * impact performance and it improves readibility.
 * I'd also argue it's not syntatic sugar because,
 * unlike Node "Classes" or even Promises which are merely
 * wrappers around JS Objects and could be implimented in JS,
 * async/await is implimented much lower down.
 */

exports.list = {

  id: 'getV10Patients',

  description: 'Returns an array of patients',

  plugins: {
    'hapi-swaggered': {
      operationId: 'getV10Patients'
    }
  },

  validate: Validations.listValidation,

  tags: ['api'],

  handler: async function(request, reply) {
    try {
      const filter = buildQueryFilter(request)

      /**
       * Helper function I use to:
       *
       *   - apply global params such as sort, offset and pageLimit,
       *   - apply a default max length when returning
       *     lists of data (to avoid attempting to get every doc in the db)
       *   - remove internal mongoose fields like __v from the response
       */
      const patients = await DbUtils.groomQuery(
        Models.Patient.find(filter),
        request,
        Config
      ).exec()

      return reply.success(200, { patients })
    } catch (err) {
      return reply.error(Boom.wrap(err))
    }
  }
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
      const patient = await DbUtils.groomQuery(
        Models.Patient.findById(id),
        request,
        Config
      ).exec()

      if (!patient) return reply.error(Boom.notFound())
      return reply.success(200, { patient })
    } catch (err) {
      return reply.error(Boom.wrap(err))
    }
  }
}

/**
 * EXTRA:
 *
 * Builds the filter criteria for databases searches.
 *
 * @params {Request} request - The reuest object.
 * @returns {Object} - The database query criteria specifying object.
 */
function buildQueryFilter(request) {
  const crit = {}

  /* allow add all query params to search filter */
  const attrs = Object.keys(Models.Patient.schema.paths)
  /* except __v */
  const vIndex = attrs.indexOf('__v')
  attrs.splice(vIndex, 1)

  attrs.forEach((attr) => {
    if (request.query[attr] !== undefined) {
      crit[attr] = request.query[attr]
    }
  })

  return crit
}

exports.post = {

  id: 'postV10Patients',

  description: 'Creates a new patient',

  plugins: {
    'hapi-swaggered': {
      operationId: 'postV10Patients'
    }
  },

  validate: {
    payload: Models.Patient.validationSchema,
    failAction: function(request, reply, source, error) {
      return reply.error(Boom.badData('Invalid Data', error.message))
    }
  },

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

exports.delete = {

  id: 'deleteV10Patient',

  description: 'Deletes a patient document.',

  plugins: {
    'hapi-swaggered': {
      operationId: 'deleteV10Patient'
    }
  },

  validate: Validations.getDelIdValidation,

  tags: ['api'],

  handler: async function(request, reply) {
    try {
      /**
       * Note: In real life, my preference would be
       * to change status to inactive instead of
       * completely deleting a patient.
       */
      const id = request.params.id
      const patient = await Models.Patient.findById(id).exec()

      if (!patient) return reply.error(Boom.notFound())
      await patient.remove()

      return reply.success(204, 'No Content')
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
 * So I like to to do both, in the interest of time though
 * I only buit and tested put completely and only implimented
 * enough of the PATCH route to show you how it
 * would look.
*/

exports.put = {

  id: 'putV10Patient',

  description: 'Updates a patient document.',

  plugins: {
    'hapi-swaggered': {
      operationId: 'putV10Patient'
    }
  },

  validate: Validations.putPatientValidation,

  tags: ['api'],


  handler: function(request, reply) {
    try {
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
