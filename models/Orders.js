const mongoose = require('mongoose')
require('dotenv').config()

const signUpSchema = new mongoose.Schema({
    username: {
        type: String
    },
    useremail: {
        type: String
    },
    complete: {
        type: Boolean,
        default: false
    },
    Name: {
        type: String
    },
    desc: {
        type: String
    },
    price:{
        type:Number
    },
    img:{
        type:String
    },
    to:{
        type:String
    },
    dele:{
        type:String
    },
    orderedon:{
        type:String,
        default:Date
    },
    Revisions:[
        {
            type:Object
        }
    ],
    Download:{
        type:String
    },
    Chat:[
        {
            type:Object
        }
    ],
    hi:{
        type:String,
        default:" "
    }
})

const orders = mongoose.model("order", signUpSchema)

module.exports = orders