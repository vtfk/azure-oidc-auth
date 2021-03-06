const config = require('../config')
const jwt = require('jsonwebtoken')
const encryptor = require('simple-encryptor')(config.jwt.encryptionSecret)

module.exports = data => {
  const tokenData = {
    data: encryptor.encrypt({
      userName: data.displayName || undefined,
      userId: data.onPremisesSamAccountName || undefined,
      email: data.upn || undefined
    }),
    graphToken: data.token || '',
    name: data.name,
    displayName: data.displayName,
    username: data.onPremisesSamAccountName || '',
    email: data.upn
  }

  const token = jwt.sign(tokenData, config.jwt.secret, config.jwt.options)
  return token
}
