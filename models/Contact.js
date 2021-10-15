const mongoose = require('mongoose')

const signUpSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    date:{
        type:String,
        default:Date
    },
    message: {
        type: String,
        required: true
    },
    hi:{
        type:String,
        default:" "
    }
})

const Contact = mongoose.model("messages", signUpSchema)

module.exports = Contact