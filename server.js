/* eslint no-console: off */

const Config = require('config')
const Glue = require('glue')
const Mongoose = require('./lib/modules/mongoose')

Mongoose.openConnection(
  Config.get('database.connection_string'), setupServer)

function setupServer() {
  const glueOptions = {
    relativeTo: process.cwd() + '/lib/modules'
  }

  Glue.compose(Config.get('glue_manifest'), glueOptions, (err, server) => {
    if (err) throw err

    server.start((err) => {
      if (err) throw err

      console.log('Server running on: ' + server.info.uri)
    })
  })
}
