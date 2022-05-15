import mongoose from 'mongoose'
mongoose.connect(`${process.env.MONGODB_URL}`)

const CandidatesFix = mongoose.model(
  'candidates-fix',
  mongoose.Schema({
    candidate: {
      type: String,
      required: true,
      unique: true,
    },
    viceCandidate: {
      type: String,
      required: true,
    },
    photo: {
      type: String,
      required: true,
    },
  })
)

export { CandidatesFix }
