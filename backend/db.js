import Validator from './model/validator.js'
import { Voter, VoterFix } from './model/voter.js'
import { Candidate, CandidateFix } from './model/candidate.js'

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
          voterStatus: validation,
          voterReason: reason,
          voterSolve: voterSolve,
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
          candidateStatus: validation,
          candidateReason: reason,
          candidateSolve: candidateSolve,
        },
      }
    )
  }

  const validators = await getValidator()
  let voterCount,
    candidateCount = 0
  for (let index = 0; index < validators.length; index++) {
    if (validators[index].voterStatus === 'valid') {
      voterCount++
    } else if (validators[index].candidateStatus === 'valid') {
      candidateCount++
    }
  }

  if (voterCount === validators.length) {
    migrate('voter')
  } else if (candidateCount === validators.length) {
    migrate('candidate')
  }
}

// migrate fixed voter & candidate
const migrate = async (type) => {
  if (type === 'voter') {
    const voters = await Voter.find()
    for (let index = 0; index < voters.length; index++) {
      console.log(voters[index])
      await VoterFix.create({
        nim: voters[index].nim,
        fullname: voters[index].fullname,
        email: voters[index].email,
        password: voters[index].password,
        public_key: voters[index].public_key,
        photo: voters[index].photo,
      })
    }
  } else if (type === 'candidate') {
    const candidates = await Candidate.find()
    for (let index = 0; index < candidates.length; index++) {
      await CandidateFix.create({
        candidate: candidates[index].candidate,
        viceCandidate: candidates[index].viceCandidate,
        photo: candidates[index].photo,
      })
    }
  }
}
// migrate('voter')

// accept solve from admin
const acceptSolve = async (data, type) => {
  const validator = await getSingleValidator(data.validatorID)
  let acceptStatus,
    status,
    reason = ''
  if (data.acceptStatus === 'true') {
    acceptStatus = 'accept'
    status = 'valid'
    reason = '-'
  } else if (data.acceptStatus === 'false') {
    acceptStatus = 'reject'
    status = 'invalid'
    if (type === 'voter') reason = validator.voterReason
    else if (type === 'candidate') reason = validator.candidateReason
  }

  if (validator !== null) {
    if (type === 'voter') {
      await Validator.updateOne(
        { _id: validator.id },
        {
          voterSolve: acceptStatus,
          voterReason: reason,
          voterStatus: status,
        }
      )
    } else if (type === 'candidate') {
      await Validator.updateOne(
        { _id: validator.id },
        {
          candidateSolve: acceptStatus,
          candidateReason: reason,
          candidateStatus: status,
        }
      )
    }
  } else {
    return console.error('error!')
  }
}

export { getValidator, getSingleValidator, validate, acceptSolve }
