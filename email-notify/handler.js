'use strict'

module.exports = async (event, context) => {
  const result = {
    'body': "email notification send",
    'content-type': "text/plain"
  }

  return context
    .status(200)
    .succeed(result)
}
