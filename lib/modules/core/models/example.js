'use strict'

const BaseSchema = require('./base_schema')
const Joi = require('joi')
const Mongoose = require('mongoose')

const Schema = Mongoose.Schema

const nestedSchema = Schema({
  number: {type: String}
})

const exampleSchema = new BaseSchema({
  id: {type: String},
  nestedSchema: nestedSchema,
  uniqueField:  {type: String},
  createdAt: {type: Date, default: Date.now()}
})

exampleSchema.statics.validationSchema = Joi.object().keys({
  id: Joi.string().required(),
  nestedSchema: Joi.object().keys({
    number: Joi.number().required()
  }),
  createdAt: Joi.date()
})

var Example = Mongoose.model('Example', exampleSchema)

exports.Example = Example
