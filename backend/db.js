import Validator from './model/validator.js'
import { Voter } from './model/voter.js'
import { Admin } from './model/admin.js'
import { Complaint } from './model/complaint.js'
import jsonwebtoken from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import ejs from 'ejs'

const getValidator = async () => {
  return await Validator.find()
}

const getSingleValidator = async (validatorID) => {
  return await Validator.findById(validatorID)
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
  const gmail = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'xtsr23@gmail.com',
      pass: 'Mas.ganteng@32',
    },
  })

  const mailtrap = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: '4e56d2a27d9572',
      pass: '81878f80487ec9',
    },
  })

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
  const validator = await getSingleValidator(data.validatorID)
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

export {
  getValidator,
  getSingleValidator,
  validate,
  acceptSolve,
  generateJWT,
  checkComplaint,
}
