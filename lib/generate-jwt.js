const config = require('../config')
const jwt = require('jsonwebtoken')
const encryptor = require('simple-encryptor')(config.jwt.encryptionSecret)

module.exports = data => {
  const tokenData = {
    data: encryptor.encrypt({
      userName: data.displayName || undefined,
      userId: data.onPremisesSamAccountName || undefined,
      email: data.upn || undefined
    })
  }

  const token = jwt.sign(tokenData, config.jwt.secret, config.jwt.options)
  return token
}
