'use strict'

const Joi = require('joi')
const Mongoose = require('mongoose')
const Util = require('util')
const Boom = require('boom')

const Schema = Mongoose.Schema

function BaseSchema() {
  Schema.apply(this, arguments)

  /**
   * Performs Joi validation of the `obj` object against the schema
   * and returns the (err, validatedJsonData) callback when done.
   *
   * @param {Object} obj - Object whose fields to validate.
   * @param {Object} joiValidationSchema - The Joi validation schema 
   *   definition object.
   * @param {Callback} callback - Callback(err, objectDataJson).
   */
  this.methods.joiValidate = function(obj, joiValidationSchema, callback) {
    const options = { abortEarly: false }
    Joi.validate(obj, joiValidationSchema, options, callback)
  }

/**
 * Before a new robot instance can be saved,
 * Check each unique field and invalidate if a robot with that field exists
 */
  this.pre('save', function(next) {
    const name = this.constructor.modelName

    if (!this.UNIQUE_FIELDS) {
      next()
    } else {
      const uniqueArr = this.UNIQUE_FIELDS()
      const uniqueChecks = uniqueArr.map(field => checkUnique(name, field))

      Promise.all(uniqueChecks)
      .then(response => next(response))
      .catch(err => next(err))
    }

  })
}

Util.inherits(BaseSchema, Schema)

/**
 * Creates non-unique error message from given key val pair.
 *
 * @param {Object} nonUniqDataObj - Object with field that failed unique check
 * @return {String} - 'mac_address must be unique'
 */
function createNonUniqErrorMessage(nonUniqDataObj) {
  const key = Object.keys(nonUniqDataObj)[0]
  const message = `${key} must be unique`
  return Boom.badData(message)
}

/**
 * Checks if there is a robot with a given key and value.
 * If there is it creates a 'non-unique' error message.
 *
 * @param {Object} Obj - Object with the fieldName and value from the new robot
 * @return {Promise Obj} - Database query.
 */
function checkUnique(name, obj) {
  return new Promise((resolve, reject) => {
    Mongoose.models[name].findOne(
      obj,
      (err, robot) => {
        if (err) {
          reject(err)
        }
        if (robot) {
          const errorMessage = createNonUniqErrorMessage(obj)
          reject(errorMessage)
        } else {
          resolve('sucesss')
        }
      }
    )
  })
}

module.exports = BaseSchema
