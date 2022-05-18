'use strict'

module.exports = async (event, context) => {
  const result = {
    'body': JSON.stringify({ users: []}),
    'content-type': "application/json"
  }

  return context
    .status(200)
    .succeed(result)
}
