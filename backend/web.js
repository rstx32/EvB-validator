import express from 'express'
import dotenv from 'dotenv'
import expressLayouts from 'express-ejs-layouts'
import passport from 'passport'
import session from 'express-session'
import connectEnsureLogin from 'connect-ensure-login'
import flash from 'connect-flash'
dotenv.config({ path: 'backend/config/.env' })

const app = express()
  .set('view engine', 'ejs')
  .use(express.urlencoded({ extended: false }))
  .use(expressLayouts)
  .use(express.static('public'))
  .use(
    session({
      secret: process.env.SECRET,
      resave: false,
      saveUninitialized: true,
    })
  )
  .use(passport.initialize())
  .use(passport.session())
  .use(flash())

import { getCandidates, getVoters } from './getAPI.js'
import { getValidator } from './db.js'
import User from './user.js'

passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

// login page
app.get('/login', (req, res) => {
  const errorMessage = req.flash('messageFailure')
  const successMessage = req.flash('messageSuccess')

  res.render('auth/login', {
    layout: 'auth/login',
    title: 'login',
    flashMessage: {errorMessage,successMessage},
  })
})

app.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: {
      type: 'messageFailure',
      message: 'wrong username or password!',
    },
    successRedirect: '/',
  }),
  (req, res) => {}
)
// end login page

app.get('/', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  res.redirect('/voters')
})

app.get('/voters', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  // if query is empty, then add default query
  if (Object.keys(req.query).length === 0) {
    req.query = {
      limit: 5,
      page: 1,
    }
  }

  const voters = await getVoters(req.query)
  res.render('voters', {
    layout: 'layouts/main-layout',
    title: 'voters',
    voters,
  })
})

app.get('/candidates', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const candidates = await getCandidates()
  const candidatesCount = candidates.length

  res.render('candidates', {
    layout: 'layouts/main-layout',
    title: 'candidates',
    candidates,
    candidatesCount,
  })
})

app.get('/validator', async (req, res) => {
  const validator = await getValidator()
  const validatorCount = validator.length

  res.render('validator', {
    layout: 'layouts/main-layout',
    title: 'validator',
    validator,
    validatorCount
  })
})

app.listen(process.env.HTTP_PORT, () => {
  console.log(
    `server is listening on http://localhost:${process.env.HTTP_PORT}`
  )
})

// run this for the first time!
// User.register({username: 'validator1', active: false}, '123')
// User.register({username: 'validator2', active: false}, '123')
// User.register({username: 'validator3', active: false}, '123')
// User.register({username: 'validator4', active: false}, '123')