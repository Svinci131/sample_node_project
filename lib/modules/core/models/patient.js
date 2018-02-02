/**
 * Patient Model
 *
 * To Do:
 *
 *  - Add better address validation.
 *
 *  - Add audits to record changes to patient data.
 *
 *  - Talk with ux people and decide what
 *    termsAccepted should default to.
 *
 *  - Add setters so all strings will be lowercased prior to be saved
 *    and edit validators so "male" and female are allowed in request bodies,
 *    but always saved as title case "Male" or "Female".
 */

const BaseSchema = require('./base_schema')
const joi = require('joi')
const Mongoose = require('mongoose')

const Schema = Mongoose.Schema

/* Declaring these static values here,
so they'll only ever need to be updated in one place */
const MIN_USER_AGE = 18
const PHONE_TYPES = ['Mobile', 'Home', 'Office']
const PATIENT_STATUSES = ['active', 'inactive']
const DEFAULT_STATUS = PATIENT_STATUSES[0]

const addressSchema = Schema({
  line1: { type: String, required: true },
  line2: { type: String, default: null },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true }
}, {
  _id: false,
  __v: false
})

const phoneSchema = Schema({
  type: { type: String, enum: PHONE_TYPES },
  number: { type: String, maxLength: 10 }
}, {
  _id: false,
  __v: false
})

const patientSchema = new BaseSchema({
  /* US Government Standards suggests 35 characters
     for each of Given Name and Family Name */
  firstName: { type: String, minLength: 1, maxLength: 35, required: true },
  middleName: { type: String, default: null },
  lastName: { type: String, minLength: 1, maxLength: 35, required: true },
  phones: { type: [phoneSchema], required: true, minLength: 1 },
  email: { type: String, required: true, unique: true },
  dob: { type: Date, required: true },
  gender: { type: String, required: true, enum: ['Male', 'Female'] }, // TODO: when saving check case
  status: { type: String, enum: PATIENT_STATUSES, default: DEFAULT_STATUS },
  termsAccepted: { type: Boolean, default: false },
  address: addressSchema
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
  timestamps: true
})

/* Acts as a back up to avoid collisions
   incase mongo indexes is unreliable -
   does not significantly impant performance.
   Also makes it easier to send more user friendly errors. */
patientSchema.methods.UNIQUE_FIELDS = function() {
  return [{ email: this.email }]
}


/* Calculate current age based on dob */
patientSchema.virtual('age').get(function() {
  return _calculateAge(this.dob)
})

/**
 * Calculate current age based on dob.
 *
 * @param { Object - date } birthday - The patient's dob.
 * @returns { Number } - The patient's age.
 */
function _calculateAge(birthday) {
  const ageDifMs = Date.now() - birthday.getTime()
  const ageDate = new Date(ageDifMs) /* miliseconds from epoch */

  return Math.abs(ageDate.getUTCFullYear() - 1970)
}


patientSchema.options.toJSON = {
  transform: function(doc, ret) {
    ret.id = ret._id
    delete ret.__v
    return ret
  }
}

const phoneValidationSchema = joi.object().keys({
  type: joi.string().valid.apply(joi, PHONE_TYPES).required(),
  /* Must be numbers only no spaces, (), or - */
  number: joi.string()
    .min(10).max(10).regex(/^[0-9]{10}$/)
    .required()
    .error(new Error('Phone Number Must be 10 Numeric Characters'))
})

/* Oldest human ever recorded was122:
   https://en.wikipedia.org/wiki/List_of_the_verified_oldest_people */
const maxAge = new Date('1896-01-01')
const minAge = new Date()

patientSchema.statics.validationSchema = joi.object().keys({
  firstName: joi.string().min(1).max(35).required(),
  middleName: joi.string().max(35).allow(null),
  lastName: joi.string().min(1).max(35).required(),
  phones: joi.array().items(phoneValidationSchema).required(),
  email: joi.string().email().required(),
  dob: joi.date().min(maxAge).max(minAge).error(new Error('Invalid DOB')),
  gender: joi.string().valid.apply(joi, ['Male', 'Female']).required(),
  status: joi.string().valid.apply(joi, PATIENT_STATUSES),
  termsAccepted: joi.boolean(),
  address: joi.object().keys({
    line1: joi.string().required(),
    line2: joi.string().allow(null),
    city: joi.string().required(),
    state: joi.string().required(),
    zip: joi.string().required()
  }),
  updatedAt: joi.date(),
  createdAt: joi.date(),
  _id: joi.string().hex().length(24),
  id: joi.string().hex().length(24)
})

patientSchema.statics.MIN_USER_AGE = MIN_USER_AGE
patientSchema.statics.PHONE_TYPES = PHONE_TYPES
patientSchema.statics.PATIENT_STATUSES = PATIENT_STATUSES
patientSchema.statics.DEFAULT_STATUS = DEFAULT_STATUS

const Patient = Mongoose.model('Patient', patientSchema)

exports.Patient = Patient
