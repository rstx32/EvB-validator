import { VotersFix } from './model/votersfix.js'
import { CandidatesFix } from './model/candidatesfix.js'
import User from './model/user.js'
import { importVoters, importCandidates } from './getAPI.js'

const getValidator = async () => {
  return await User.find()
}

const getSingleValidator = async (validatorID) => {
  return await User.findById(validatorID)
}

// create voter validation
const voterValidate = async (validatorID) => {
  await User.updateOne(
    {
      _id: validatorID,
    },
    {
      $set: {
        voter: true,
      },
    }
  )

  const validators = await getValidator()
  let count = 0
  for (let index = 0; index < validators.length; index++) {
    if (validators[index].voter) {
      count++
    }
  }

  if (count === validators.length) {
    migrateVoters()
  }
}

// migrate fixed voter
const migrateVoters = async () => {
  const rawVoters = await importVoters()
  const voters = rawVoters.docs

  for (let index = 0; index < voters.length; index++) {
    await VotersFix.create({
      nim: voters[index].nim,
      fullname: voters[index].fullname,
      email: voters[index].email,
      password: voters[index].password,
      public_key: voters[index].public_key,
      photo: voters[index].photo,
    })
  }
}

// migrate fixed candidates
const migrateCandidates = async () => {
  const rawCandidates = await importCandidates()
  const candidates = rawCandidates

  for (let index = 0; index < candidates.length; index++) {
    await CandidatesFix.create({
      candidate: candidates[index].candidate,
      viceCandidate: candidates[index].viceCandidate,
      photo: candidates[index].photo,
    })
  }
}

// check if validator is validate
const isVoterValidated = async (validatorID) => {
  const validator = await getSingleValidator(validatorID)
  return validator.voter ? true : false
}

// create candidate validation
const candidateValidate = async (validatorID) => {
  await User.updateOne(
    {
      _id: validatorID,
    },
    {
      $set: {
        candidate: true,
      },
    }
  )

  const validators = await getValidator()
  let count = 0
  for (let index = 0; index < validators.length; index++) {
    if (validators[index].candidate) {
      count++
    }
  }

  if (count === validators.length) {
    migrateCandidates()
  }
}

// check if validator is validate
const isCandidateValidated = async (validatorID) => {
  const validator = await getSingleValidator(validatorID)
  return validator.candidate ? true : false
}

export {
  getValidator,
  voterValidate,
  isVoterValidated,
  isCandidateValidated,
  candidateValidate,
}
