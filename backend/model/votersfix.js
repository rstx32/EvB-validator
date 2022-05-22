import mongoose from 'mongoose'
mongoose.connect(`${process.env.MONGODB_URL}`)

const VotersFix = mongoose.model(
  'voters-fix',
  mongoose.Schema({
    nim: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullname: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      default: null,
    },
    public_key: {
      type: String,
      default: null,
    },
    photo: String,
  })
)

export default VotersFix
