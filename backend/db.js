import mongoose from 'mongoose'
mongoose.connect(`${process.env.MONGODB_URL}`)

const Validator = mongoose.model('users', mongoose.Schema({
    username : {
        type: String,
        required: true,
    },
    voter : {
        type: Boolean,
        required: true,
        default: false,
    },
    candidate : {
        type: Boolean,
        required: true,
        default: false,
    },
}))

const getValidator = async () => {
    return await Validator.find()
}

export {getValidator}