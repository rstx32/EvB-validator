import mongoose from 'mongoose'
mongoose.connect(`${process.env.MONGODB_URL}`)

const candidateSchema = new mongoose.Schema({
  candidate: {
    type: String,
    required: true,
  },
  viceCandidate: String,
  photo: String,
})

const Candidate = mongoose.model('candidate', candidateSchema)
const CandidateFix = mongoose.model('candidates-fix', candidateSchema)

export { Candidate, CandidateFix }
