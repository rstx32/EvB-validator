import Validator from './model/validator.js'
import { Voter } from './model/voter.js'
import { Admin } from './model/admin.js'
import { Complaint } from './model/complaint.js'
import { gmail, mailtrap } from './email.js'
import jsonwebtoken from 'jsonwebtoken'
import randomstring from 'randomstring'
import ejs from 'ejs'

// get all validators
const getValidator = async () => {
  return await Validator.find()
}

// get a validator
const getSingleValidator = async (key, type) => {
  if (type === 'findbyid') return await Validator.findById(key)
  else if (type === 'findbyemail')
    return await Validator.findOne({ email: key })
  else if (type === 'findbyresetkey')
    return await Validator.findOne({ key: key })
}

// create validation
const validate = async (data, type) => {
  const validatorID = data.validator
  const validation = data.validation
  let voterSolve,
    candidateSolve,
    reason = ''
  if (validation === 'valid') {
    voterSolve = 'accept'
    candidateSolve = 'accept'
    reason = '-'
  } else {
    voterSolve = 'unsolved'
    candidateSolve = 'unsolved'
    reason = data.reason
  }

  if (type === 'voter') {
    await Validator.updateOne(
      {
        _id: validatorID,
      },
      {
        $set: {
          'voter.status': validation,
          'voter.reason': reason,
          'voter.solve': voterSolve,
        },
      }
    )
  } else if (type === 'candidate') {
    await Validator.updateOne(
      {
        _id: validatorID,
      },
      {
        $set: {
          'candidate.status': validation,
          'candidate.reason': reason,
          'candidate.solve': candidateSolve,
        },
      }
    )
  }

  isValidatorValidated()
}

// check if all validator is validated
const isValidatorValidated = async () => {
  const validators = await getValidator()
  let voterCount = 0,
    candidateCount = 0
  for (let index = 0; index < validators.length; index++) {
    if (validators[index].voter.status === 'valid') {
      voterCount++
    }
    if (validators[index].candidate.status === 'valid') {
      candidateCount++
    }
  }

  if (voterCount === validators.length) {
    lockAdmin('voter')
    sendEmail()
  }
  if (candidateCount === validators.length) {
    lockAdmin('candidate')
  }
}

// lock admin from CRUD
const lockAdmin = async (type) => {
  if (type === 'voter') {
    await Admin.updateOne(
      {
        username: 'admin',
      },
      {
        $set: {
          voterAccess: 'deny',
        },
      }
    )
  } else if (type === 'candidate') {
    await Admin.updateOne(
      {
        username: 'admin',
      },
      {
        $set: {
          candidateAccess: 'deny',
        },
      }
    )
  }
}

// send email to voter
const sendEmail = async () => {
  const voters = await Voter.find()
  const extractValue = (arr, prop) => {
    let extractedValue = arr.map((item) => item[prop])
    return extractedValue
  }
  const voterEmail = extractValue(voters, 'email')

  const sendBulkEmail = (interval) => {
    setTimeout(async () => {
      const fileHTML = await ejs.renderFile('views/email.ejs', {
        voter: voters[interval].fullname,
        key: voters[interval].key,
      })
      const mailOptions = {
        from: 'evb-organizer@evb.com',
        to: voterEmail[interval],
        subject: 'Voter Registration',
        html: fileHTML,
      }
      mailtrap.sendMail(mailOptions)
      console.log(`send email ${interval}`)
    }, 2500 * interval)
  }

  for (let i = 0; i < voters.length; i++) {
    sendBulkEmail(i)
  }
}

// accept solve from admin
const acceptSolve = async (data, type) => {
  const validator = await getSingleValidator(data.validatorID, 'findbyid')
  let acceptStatus = '',
    status = '',
    reason = ''
  if (data.acceptStatus === 'true') {
    acceptStatus = 'accept'
    status = 'valid'
    reason = '-'
  } else if (data.acceptStatus === 'false') {
    acceptStatus = 'reject'
    status = 'invalid'
    if (type === 'voter') reason = validator.voter.reason
    else if (type === 'candidate') reason = validator.candidate.reason
  }

  if (validator !== null) {
    if (type === 'voter') {
      await Validator.updateOne(
        { _id: validator.id },
        {
          'voter.solve': acceptStatus,
          'voter.reason': reason,
          'voter.status': status,
        }
      )
    } else if (type === 'candidate') {
      await Validator.updateOne(
        { _id: validator.id },
        {
          'candidate.solve': acceptStatus,
          'candidate.reason': reason,
          'candidate.status': status,
        }
      )
    }
  } else {
    return console.error('error!')
  }
}

// generate JWT for validator
const generateJWT = async (username) => {
  const token = jsonwebtoken.sign({ username: username }, process.env.JWT, {
    expiresIn: '7d',
  })

  return await Validator.updateOne(
    { username: username },
    {
      $set: {
        token: token,
      },
    }
  )
}

// check if complaint is still exist
const checkComplaint = async () => {
  return await Complaint.find({
    status: 'unsolved',
  })
}

// create validator account from environment
const isAccountExist = async (username) => {
  return await Validator.findOne({ username: username })
}

// create validator account
const createAccount = async (username, email) => {
  const account = await isAccountExist(username)
  const password = randomstring.generate(8)

  if (account === null) {
    // register validator
    Validator.register({ username: username, active: false }, password)

    // insert validator email to database
    setTimeout(async () => {
      await Validator.updateOne(
        {
          username: username,
        },
        {
          $set: {
            email: email,
          },
        }
      )
    }, 500)

    // generate JWT for each validator
    setTimeout(() => {
      generateJWT(username)
    }, 500)

    // send password to validator's email
    mailtrap.sendMail({
      from: 'evb-organizer@evb.com',
      to: email,
      subject: 'EvB Validator Access',
      text: `validator password for access : ${password}`,
    })
  } else {
    return
  }
}

// set reset key to validator's email
const sendResetKey = async (email) => {
  const validator = getSingleValidator(email, 'findbyemail')
  if (validator !== null) {
    const randomkey = randomstring.generate(6)

    await Validator.updateOne(
      {
        email: email,
      },
      {
        $set: {
          key: randomkey,
        },
      }
    )

    mailtrap.sendMail({
      from: 'evb-organizer@evb.com',
      to: email,
      subject: 'Validator Reset Password',
      text: `validator password reset key : ${randomkey}`,
    })

    return true
  } else {
    return false
  }
}

// reset password validator
const resetPassword = async (data) => {
  const validator = await getSingleValidator(data.email, 'findbyemail')

  const result = await Validator.findByUsername(validator.username)
  await result.setPassword(data.password)
  await result.save()

  await Validator.updateOne(
    {
      username: validator.username,
    },
    {
      $set: {
        key: null,
      },
    }
  )

  return result
}

export {
  getValidator,
  getSingleValidator,
  validate,
  acceptSolve,
  checkComplaint,
  createAccount,
  sendResetKey,
  resetPassword,
}
