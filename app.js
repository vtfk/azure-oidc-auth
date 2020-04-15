const express = require('express')
const cookieParser = require('cookie-parser')
const expressSession = require('express-session')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const passport = require('passport')
const bunyan = require('bunyan')
const config = require('./config')
const path = require('path')

const OIDCStrategy = require('passport-azure-ad').OIDCStrategy

const log = bunyan.createLogger({
  name: 'OIDC logger'
})

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
  for (const i = 0, len = users.length; i < len; i++) {
    const user = users[i]
    log.info('we are using user: ', user)
    if (user.oid === oid) {
      return fn(null, user)
    }
  }
  return fn(null, null)
}

passport.use(new OIDCStrategy({
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
},
function (iss, sub, profile, accessToken, refreshToken, done) {
  if (!profile.oid) {
    return done(new Error('No oid found'), null)
  }
  // asynchronous verification, for effect...
  process.nextTick(function () {
    findByOid(profile.oid, function (err, user) {
      if (err) {
        return done(err)
      }
      if (!user) {
        // "Auto-registration"
        users.push(profile)
        return done(null, profile)
      }
      return done(null, user)
    })
  })
}
))

// -----------------------------------------------------------------------------
// Config the app, include middlewares
// -----------------------------------------------------------------------------
const app = express()

app.set('views', path.join(__dirname, '/views'))
app.set('view engine', 'ejs')
app.use(express.logger())
app.use(methodOverride())
app.use(cookieParser())

app.use(expressSession({ secret: 'keyboard cat', resave: true, saveUninitialized: false }))

app.use(bodyParser.urlencoded({ extended: true }))

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize())
app.use(passport.session())
app.use(app.router)
app.use(express.static(path.join(__dirname, '/../../public')))

// -----------------------------------------------------------------------------
// Set up the route controller
//
// 1. For 'login' route and 'returnURL' route, use `passport.authenticate`.
// This way the passport middleware can redirect the user to login page, receive
// id_token etc from returnURL.
//
// 2. For the routes you want to check if user is already logged in, use
// `ensureAuthenticated`. It checks if there is an user stored in session, if not
// it will call `passport.authenticate` to ask for user to log in.
// -----------------------------------------------------------------------------
function ensureAuthenticated (req, res, next) {
  if (req.isAuthenticated()) { return next() }
  res.redirect('/login')
};

app.get('/', function (req, res) {
  res.render('index', { user: req.user })
})

// '/account' is only available to logged in user
app.get('/account', ensureAuthenticated, function (req, res) {
  res.render('account', { user: req.user })
})

app.get('/login',
  function (req, res, next) {
    req.session.origin = req.query.origin
    passport.authenticate('azuread-openidconnect',
      {
        response: res, // required
        resourceURL: config.resourceURL, // optional. Provide a value if you want to specify the resource.
        customState: 'my_state', // optional. Provide a value if you want to provide custom state value.
        failureRedirect: '/'
      }
    )(req, res, next)
  },
  function (req, res) {
    log.info('Login was called in the Sample')
    res.redirect('/')
  })

// 'GET returnURL'
// `passport.authenticate` will try to authenticate the content returned in
// query (such as authorization code). If authentication fails, user will be
// redirected to '/' (home page); otherwise, it passes to the next middleware.
app.get('/auth/openid/return',
  function (req, res, next) {
    passport.authenticate('azuread-openidconnect',
      {
        response: res, // required
        failureRedirect: '/'
      }
    )(req, res, next)
  },
  function (req, res) {
    log.info('We received a return from AzureAD.')
    res.redirect('/')
  })

// 'POST returnURL'
// `passport.authenticate` will try to authenticate the content returned in
// body (such as authorization code). If authentication fails, user will be
// redirected to '/' (home page); otherwise, it passes to the next middleware.
app.post('/auth/openid/return',
  function (req, res, next) {
    passport.authenticate('azuread-openidconnect',
      {
        response: res, // required
        failureRedirect: '/'
      }
    )(req, res, next)
  },
  function (req, res) {
    log.info('We received a return from AzureAD.')
    res.redirect('/')
  })

// 'logout' route, logout from passport, and destroy the session with AAD.
app.get('/logout', function (req, res) {
  req.session.destroy(function (err) {
    req.logOut()
    res.redirect(config.destroySessionUrl)
  })
})

app.listen(3000)
