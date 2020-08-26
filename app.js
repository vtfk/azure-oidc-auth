const express = require('express')
const cookieParser = require('cookie-parser')
const expressSession = require('express-session')
const bodyParser = require('body-parser')
const queryString = require('query-string')

const azurePassport = require('./lib/azure-passport')
const config = require('./config')
const logger = require('./lib/logger')
const generateJwt = require('./lib/generate-jwt')

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(expressSession({ secret: config.cookieSecret, resave: true, saveUninitialized: false }))

app.use(azurePassport.initialize())
app.use(azurePassport.session())

app.get('/', (req, res) => {
  res.send('Hello lovely human! Move along, nothing to see here... :)')
})

app.get('/login', (req, res) => {
  const { origin, ...params } = req.query
  if (!origin) {
    return res.status(400).send('No origin param set')
  }

  logger('info', ['login', 'origin', origin])
  req.session.origin = origin
  req.session.params = params || null

  // Let passport do the rest...
  azurePassport.authenticate('azuread-openidconnect', { response: res, failureRedirect: '/' })(req, res)
})

app.post('/callback',
  (req, res, next) => {
    azurePassport.authenticate('azuread-openidconnect', { response: res, failureRedirect: '/' })(req, res, next)
  },
  (req, res) => {
    const { origin, params } = req.session

    logger('info', ['callback', 'origin', origin, 'user', JSON.stringify(req.user)])

    const jwt = generateJwt(req.user)
    const queries = queryString.stringify({ jwt, ...params })

    res.redirect(`${origin}?${queries}`)
  }
)

app.get('/logout', (req, res) => {
  logger('info', ['logout'])

  req.session.destroy(() => {
    req.logOut()
    res.redirect(config.destroySessionUrl)
  })
})

app.listen(config.port, () => {
  logger('info', ['listening on port', config.port])
})
