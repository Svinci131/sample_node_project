'use strict'

exports.ping = {

  description: 'Returns "pong"',

  handler: function(request, reply) {
    return reply.success(200, 'pong')
  }

}
