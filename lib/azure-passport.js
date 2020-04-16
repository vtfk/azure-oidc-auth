const passport = require('passport')
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy

const config = require('../config')
const logger = require('./logger')
const getGraphUser = require('./get-graph-user')

passport.serializeUser(function (user, done) {
  done(null, user.oid)
})

passport.deserializeUser(function (oid, done) {
  findByOid(oid, function (err, user) {
    done(err, user)
  })
})

// array to hold logged in users
const users = []

const findByOid = function (oid, fn) {
  for (let i = 0, len = users.length; i < len; i++) {
    const user = users[i]
    logger('info', ['passport', 'findByOid', user])
    if (user.oid === oid) {
      return fn(null, user)
    }
  }
  return fn(null, null)
}

const strategyOptions = {
  identityMetadata: config.creds.identityMetadata,
  clientID: config.creds.clientID,
  responseType: config.creds.responseType,
  responseMode: config.creds.responseMode,
  redirectUrl: config.creds.redirectUrl,
  allowHttpForRedirectUrl: config.creds.allowHttpForRedirectUrl,
  clientSecret: config.creds.clientSecret,
  validateIssuer: config.creds.validateIssuer,
  isB2C: config.creds.isB2C,
  issuer: config.creds.issuer,
  passReqToCallback: config.creds.passReqToCallback,
  scope: config.creds.scope,
  loggingLevel: config.creds.loggingLevel,
  nonceLifetime: config.creds.nonceLifetime,
  nonceMaxAmount: config.creds.nonceMaxAmount,
  useCookieInsteadOfSession: config.creds.useCookieInsteadOfSession,
  cookieEncryptionKeys: config.creds.cookieEncryptionKeys,
  clockSkew: config.creds.clockSkew
}

const strategy = new OIDCStrategy(strategyOptions,
  (iss, sub, profile, accessToken, refreshToken, done) => {
    if (!profile.oid) {
      return done(new Error('No oid found'), null)
    }

    process.nextTick(async () => {
      // Get additional user info from Graph
      const { onPremisesSamAccountName } = await getGraphUser(accessToken)

      findByOid(profile.oid, function (err, user) {
        if (err) {
          return done(err)
        }

        if (!user) {
          // "Auto-registration"
          user = { ...profile, onPremisesSamAccountName }
          users.push(user)
        }

        return done(null, user)
      })
    })
  })

passport.use(strategy)
module.exports = passport
