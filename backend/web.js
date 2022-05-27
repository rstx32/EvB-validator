import express from 'express'
import dotenv from 'dotenv'
import expressLayouts from 'express-ejs-layouts'
import passport from 'passport'
import session from 'express-session'
import connectEnsureLogin from 'connect-ensure-login'
import flash from 'connect-flash'
import { getCandidates, getVoters } from './getAPI.js'
import {
  getValidator,
  getSingleValidator,
  validate,
  acceptSolve,
  generateJWT,
  checkComplaint,
} from './db.js'
import Validator from './model/validator.js'
dotenv.config({ path: 'backend/config/.env' })

const app = express()
  .set('view engine', 'ejs')
  .use(express.urlencoded({ extended: false }))
  .use(expressLayouts)
  .use(express.static('public'))
  .use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
    })
  )
  .use(passport.initialize())
  .use(passport.session())
  .use(flash())

passport.use(Validator.createStrategy())
passport.serializeUser(Validator.serializeUser())
passport.deserializeUser(Validator.deserializeUser())

// auth
app.get('/login', (req, res) => {
  const errorMessage = req.flash('messageFailure')
  const successMessage = req.flash('messageSuccess')

  res.render('auth/login', {
    layout: 'auth/login',
    title: 'login',
    flashMessage: { errorMessage, successMessage },
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

app.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/login')
})
// end auth

// root page
app.get('/', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  res.redirect('/voters')
})

// voters
app.get('/voters', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const user = req.user._id
  const voters = await getVoters(req.query, user)
  const validator = await getSingleValidator(user)
  const errorMessage = req.flash('errorMessage')
  const isComplaintExist = await checkComplaint()

  res.render('voters', {
    layout: 'layouts/main-layout',
    title: 'voters',
    voters,
    user,
    validator,
    errorMessage,
    isComplaintExist,
  })
})

// candidates
app.get(
  '/candidates',
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const user = req.user._id
    const candidates = await getCandidates(user)
    const validator = await getSingleValidator(user)

    res.render('candidates', {
      layout: 'layouts/main-layout',
      title: 'candidates',
      candidates,
      user,
      validator,
    })
  }
)

// validator
app.get('/validator', async (req, res) => {
  const validator = await getValidator()
  const validatorCount = validator.length

  res.render('validator', {
    layout: 'layouts/main-layout',
    title: 'validator',
    validator,
    validatorCount,
  })
})

// validation
app.post('/validate/:type', async (req, res, next) => {
  const isComplaintExist = await checkComplaint()
  if (req.params.type === 'voter' && isComplaintExist.length > 0) {
    req.flash('errorMessage', 'complaint still exist, wait for admin solve')
    res.redirect('/voters')
  } else {
    if (req.params.type === 'voter' || req.params.type === 'candidate') {
      await validate(req.body, req.params.type)
      res.redirect('/validator')
    } else {
      res.redirect(next)
    }
  }
})

// accept solve
app.post('/solve/:type', async (req, res, next) => {
  if (req.params.type === 'voter' || req.params.type === 'candidate') {
    await acceptSolve(req.body, req.params.type)
    res.redirect('/validator')
  } else {
    res.redirect(next)
  }
})

// page not found
app.use((req, res) => {
  res.status(404).send('404 : not found')
})

app.listen(process.env.HTTP_PORT, () => {
  console.log(
    `server is listening on http://localhost:${process.env.HTTP_PORT}`
  )
})

// run this for the first time!
// Validator.register({username: 'validator1', active: false}, '123')
// generateJWT('validator1')
// Validator.register({username: 'validator2', active: false}, '123')
// generateJWT('validator2')
// Validator.register({username: 'validator3', active: false}, '123')
// generateJWT('validator3')
// Validator.register({username: 'validator4', active: false}, '123')
// generateJWT('validator4')
// Validator.register({username: 'validator5', active: false}, '123')
// generateJWT('validator5')
