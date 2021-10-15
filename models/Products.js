const mongoose = require('mongoose')
require('dotenv').config()

const signUpSchema = new mongoose.Schema({
    Name:{
        type:String
    },
    desc:{
        type:String
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
        type:Number
    },
    CartAbout:{
        type:String
    },
    hi:{
        type:String,
        default:" "
    }
})

const products = mongoose.model("product", signUpSchema)

module.exports = products