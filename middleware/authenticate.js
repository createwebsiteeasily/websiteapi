const jwt = require("jsonwebtoken")
const signUp = require("../models/signup")
const authenticate = async (req, res, next) => {
    try {
        const token = req.body.user;
        const verifytoken = jwt.verify(token, process.env.SECRET_KEY)

        const rootUser = await signUp.findOne({ _id: verifytoken._id, "tokens.token": token })
        if (!rootUser) {
            throw new Error('User Not Found') 
        }
        else{
            res.status(200)
        }

        req.token = token
        req.rootUser = rootUser
        req.userID = rootUser._id
    }
    catch (err) {
        // console.log(err)
        res.status(401).send("User not Authorized")
    }
    next()
}

module.exports = authenticate