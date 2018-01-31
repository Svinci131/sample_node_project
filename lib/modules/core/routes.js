const PatientCtrl = require('./controllers/patient')

const ExampleCtrl = require('./controllers/example')
const Extensions = require('./extensions')
const MiscCtrl = require('./controllers/misc')
const Pkg = require('./package.json')

const routes = [

  {
    method: 'GET',
    path: '/ping',
    config: MiscCtrl.ping
  },
  {
    method: 'GET',
    path: '/api/v1.0/patients',
    config: PatientCtrl.list
  },
  {
    method: 'GET',
    path: '/api/v1.0/examples',
    config: ExampleCtrl.list
  },
  {
    method: 'GET',
    path: '/api/v1.0/example',
    config: ExampleCtrl.get
  }

]

exports.register = function(server, options, next) {
  Extensions.register(server)
  server.route(routes)

  next()
}

exports.register.attributes = {
  pkg: Pkg
}
