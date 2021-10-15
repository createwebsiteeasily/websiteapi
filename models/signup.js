const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken")
require('dotenv').config()

const signUpSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    cpassword: {
        type: String,
        required: true
    },
    tokens:[
        {
            token:String
        }
    ]
})

// We are generating token
signUpSchema.methods.generateAuthToken = async function(){
    try{
        const token = jwt.sign({_id:this._id}, process.env.SECRET_KEY)
        this.tokens = this.tokens.concat({token:token})
        await this.save()
        return token
    }
    catch(err){
        console.log(`The error occured ${err}`)
    }
}

signUpSchema.pre("save", async function (next) {
    if (this.isModified('password')) {
        // this.name = await bcrypt.hash(this.name, 4)
        // this.phone = await bcrypt.hash(this.phone, 4)
        // this.work = await bcrypt.hash(this.work, 4)
        this.password = await bcrypt.hash(this.password, 10)
        this.cpassword = await bcrypt.hash(this.cpassword, 10)
    }
    next()
})

const signUp = mongoose.model("user", signUpSchema)

module.exports = signUp