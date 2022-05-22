import mongoose from 'mongoose'
import dotenv from 'dotenv'
import passportLocalMongoose from 'passport-local-mongoose'
dotenv.config({ path: 'backend/config/.env' })

// Connecting Mongoose
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

// schema user validator
const validatorSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  }, 
  voterStatus: {
    type: String,
    enum: ['-', 'valid', 'invalid'],
    default: '-'
  },
  candidateStatus: {
    type: String,
    enum: ['-', 'valid', 'invalid'],
    default: '-'
  },
  voterReason: {
    type: String,
    default: '-'
  },
  candidateReason: {
    type: String,
    default: '-'
  },
  voterSolve: {
    type: String,
    enum: ['-', 'solved', 'unsolved', 'reject', 'accept'],
    default: '-'
  },
  candidateSolve: {
    type: String,
    enum: ['-', 'solved', 'unsolved', 'reject', 'accept'],
    default: '-'
  },
})

validatorSchema.plugin(passportLocalMongoose)

export default mongoose.model('Validator', validatorSchema)
