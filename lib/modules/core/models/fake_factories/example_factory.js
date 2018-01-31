'use strict'

const ModelFactory = require('../../../model_factory')
const Models = require('../../../core/models')

var exampleFactory = new ModelFactory(
  Models.Example,
  function(onDataGenerated) {
    var data = {
      'id': '89e747561f7424be64f85342',
      'nestedSchema': {
        'number': 5
      }
    }

    onDataGenerated(data)
  }
)

module.exports = exampleFactory
