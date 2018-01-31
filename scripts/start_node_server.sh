#!/bin/sh

# Starts the Node.js server for the environment given by the environmental
# variable NODE_ENV.

echo "Initiating Node.js environment in $NODE_ENV mode"

case "$NODE_ENV" in
 "develop")
   nodemon --debug server.js
   ;;
 "testing")
   npm start
   ;;
 "dev")
   npm start
   ;;
 "staging")
   npm start
   ;;
 "production")
   npm start
   ;;
 *)
   echo "Unknown value of the NODE_ENV system variable: $NODE_ENV"
   ;;
esac
