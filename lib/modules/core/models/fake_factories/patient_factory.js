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
        number: Faker.phone.phoneNumber()
      }],
      email: Faker.internet.email(),
      dob: new Date(),
      age: 37,
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
