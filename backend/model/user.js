import mongoose from 'mongoose'
import passportLocalMongoose from 'passport-local-mongoose'
import dotenv from 'dotenv'
dotenv.config({ path: 'backend/config/.env' })

// Connecting Mongoose
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

// schema user validator
const User = new mongoose.Schema({
  username: String,
  password: String,
  voter: Boolean,
  candidate: Boolean,
})

User.plugin(passportLocalMongoose)

export default mongoose.model('User', User)
