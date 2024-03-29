const Faker = require('faker')
const ModelFactory = require('../../../model_factory')
const Models = require('../../../core/models')

const patientFactory = new ModelFactory(
  Models.Patient,
  function(onDataGenerated) {
    const data = {
      firstName: Faker.name.firstName(),
      lastName: Faker.name.lastName(),
      phones: [{
        type: 'Mobile',
        number: '9184901670'
      }],
      email: Faker.internet.email(),
      dob: Faker.date.past(),
      gender: 'Male',
      address: {
        line1: Faker.address.streetAddress(),
        city: Faker.address.city(),
        state: Faker.address.state(),
        zip: Faker.address.zipCode()
      }
    }

    onDataGenerated(data)
  }
)

module.exports = patientFactory
