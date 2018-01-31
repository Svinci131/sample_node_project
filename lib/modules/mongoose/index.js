/* eslint no-console: off */

'use strict'

const Mongoose = require('mongoose')

module.exports = {

  /**
   * Creates and opens a mongoose connection for the given connection string.
   *
   * @param {string} connectionString - The database connection string.
   * @param {callback} onConnectionOpen - callback(err, mongoose).
   */
  openConnection: function(connectionString, onConnectionOpen) {
    Mongoose.connect(connectionString)

    let conn = Mongoose.connection

    conn.on('error', console.error.bind(console, 'connection error:'))
    conn.once('open', () => {
      console.log('Database connection established: ' + connectionString)
      return onConnectionOpen(null, Mongoose)
    })
  }

}
