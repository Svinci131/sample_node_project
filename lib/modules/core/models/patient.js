const BaseSchema = require('./base_schema')
const joi = require('joi')
const Mongoose = require('mongoose')

// const joi = Joi.extend(require('joi-phone-number'))

const Schema = Mongoose.Schema

/* Declaring these static values here,
so they'll only ever need to be updated in one place */

const MIN_USER_AGE = 18
const PHONE_TYPES = ['Mobile', 'Home', 'Office']
const PATIENT_STATUSES = ['active', 'inactive']
const DEFAULT_STATUS = PATIENT_STATUSES[0]

//TO DO BONUS - AUDITS, Unique validation

const addressSchema = Schema({
  line1: { type: String, required: true },
  line2: { type: String, default: null },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true }
}, {
  _id: false,
  __v: false
})//TO DO VALIDATE ADDRESS

const phoneSchema = Schema({
  type: { type: String, enum: PHONE_TYPES },
  number: { type: String, maxLength: 11 } //TO DO PHONE NUMBER VALIDATION
}, {
  _id: false,
  __v: false
})

const patientSchema = new BaseSchema({
  /* UK Government Data Standards Catalogue suggests 35 characters
     for each of Given Name and Family Name */
  firstName: { type: String, minLength: 1, maxLength: 35, required: true },
  middleName: { type: String, default: null },
  lastName: { type: String, minLength: 1, maxLength: 35, required: true },
  phones: { type: [phoneSchema], required: true, minLength: 1 },
  email: { type: String, required: true }, //validate
  dob: { type: Date, required: true }, //validate range
  age: { type: Number, required: true }, /* should be calculated as a virtual */
  gender: { type: String, required: true, enum: ['Male', 'Female'] }, // TODO: when saving check case
  status: { type: String, enum: PATIENT_STATUSES, default: DEFAULT_STATUS },
  termsAccepted: { type: Boolean, default: false }, //TODO: think abt default
  address: addressSchema
}, {
  timestamps: true
})


patientSchema.options.toJSON = {
  transform: function(doc, ret) {
    ret.id = ret._id
    // delete ret._id
    delete ret.__v
    return ret
  }
}

const phoneValidationSchema = joi.object().keys({
  type: joi.string().valid.apply(joi, PHONE_TYPES),
  number: joi.string() //.phoneNumber()
})

patientSchema.statics.validationSchema = joi.object().keys({
  firstName: joi.string().min(1).max(35).required(),
  middleName: joi.string().max(35).allow(null),
  lastName: joi.string().min(1).max(35).required(),
  phones: joi.array(), //.items(phoneValidationSchema).required(),
  email: joi.string().email().required(),
  dob: joi.date(), // TO DO: validate min and max
  age: joi.number().min(MIN_USER_AGE).max(122),  /* https://en.wikipedia.org/wiki/List_of_the_verified_oldest_people */
  gender: joi.string().valid.apply(joi, ['Male', 'Female']).required(), // TODO: when saving check case
  status: joi.string().valid.apply(joi, PATIENT_STATUSES),
  termsAccepted: joi.boolean(), //TODO: think abt default
  address: joi.object().keys({
    line1: joi.string().required(),
    line2: joi.string().allow(null),
    city: joi.string().required(), //TODO: VALIDATOIN
    state: joi.string().required(),
    zip: joi.string().required()
  })
})

patientSchema.statics.MIN_USER_AGE = MIN_USER_AGE
patientSchema.statics.PHONE_TYPES = PHONE_TYPES
patientSchema.statics.PATIENT_STATUSES = PATIENT_STATUSES
patientSchema.statics.DEFAULT_STATUS = DEFAULT_STATUS

const Patient = Mongoose.model('Patient', patientSchema)

exports.Patient = Patient
