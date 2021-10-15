const express = require('express')
const router = express.Router()
const signUp = require("../models/signup")
const bcrypt = require("bcrypt")
require('../db/conn')
const authenticate = require("../middleware/authenticate")
const Contact = require("../models/Contact")
const orders = require("../models/Orders")
const products = require("../models/Products")
require("dotenv").config()
const nodemailer = require("nodemailer")
const Razorpay = require("razorpay");
const path = require("path")
const shortid = require("shortid")
const { v4: uuidv4 } = require("uuid")
const PaytmChecksum = require("./PaytmChecksum")
const formidable = require("formidable")
const https = require("https")


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET
})


/* paytm */

router.get("/", (req, res) => {
    res.send("Hom")
})

router.post('/callback', (req, res) => {
    const current_url = new URL(`http://localhost.com/${req.url}`);
    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, file) => {
        // console.log(fields)
        paytmChecksum = fields.CHECKSUMHASH;
        delete fields.CHECKSUMHASH;

        var isVerifySignature = PaytmChecksum.verifySignature(fields, process.env.PAYTM_MERCHANT_KEY, paytmChecksum);
        if (isVerifySignature) {
            var paytmParams = {};
            paytmParams["MID"] = fields.MID;
            paytmParams["ORDERID"] = fields.ORDERID;
            /*
            * Generate checksum by parameters we have
            * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
            */
            PaytmChecksum.generateSignature(paytmParams, process.env.PAYTM_MERCHANT_KEY).then(function (checksum) {

                paytmParams["CHECKSUMHASH"] = checksum;
                var post_data = JSON.stringify(paytmParams);
                var options = {
                    /* for Staging */
                    hostname: 'securegw-stage.paytm.in',
                    /* for Production */
                    // hostname: 'securegw.paytm.in',
                    port: 443,
                    path: '/order/status',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': post_data.length
                    }
                };
                var response = "";
                var post_req = https.request(options, function (post_res) {
                    post_res.on('data', function (chunk) {
                        response += chunk;
                    });
                    post_res.on('end', function () {
                        let result = JSON.parse(response)
                        if (result.STATUS === 'TXN_SUCCESS') {
                            const getOrder = async () => {
                                try {
                                    let username = current_url.searchParams.get("username")
                                    let useremail = current_url.searchParams.get("useremail")
                                    let name = current_url.searchParams.get("name")
                                    let desc = current_url.searchParams.get("desc")
                                    let price = current_url.searchParams.get("price")
                                    let img = current_url.searchParams.get("img")
                                    let to = ""
                                    let dele = current_url.searchParams.get("dele")

                                    const neworder = new orders({ username, useremail, name, desc, price, img, to, dele, Download: "" })
                                    await neworder.save()
                                }
                                catch (err) {
                                    res.status(404).json({ nooke: "nook", error: `${err}` })
                                }
                            }
                            getOrder()
                            res.redirect(`http://localhost:3000/my-cart`)
                        }
                        else {
                            async function hi() {
                                try {
                                    let name = current_url.searchParams.get("name")
                                    let hello = await products.find({Name:name})
                                    res.redirect(`http://localhost:3000${hello[0].to}/shop`)
                                }
                                catch {
                                    res.redirect(`http://localhost:3000/`)
                                }
                            }
                            hi()
                        }
                    });
                });
                post_req.write(post_data);
                post_req.end();
            });
        } else {
            res.send("Stop messing with the paytm payment gateway😡😡");
        }
    })

})

router.post("/sdfjladsfjlasdf/name", (req, res) => {
    const current_url = new URL(`http://localhost.com/${req.url}`);
    // res.send(`${current_url.searchParams.get('id')}`)
    res.send(`${current_url.searchParams.get('id')} ${req.url}`)
})

router.post("/payment", (req, res) => {
    const email = req.body.email
    const totalAmount = JSON.stringify(req.body.amount)
    var params = {};

    /* initialize an array */
    redirectses = {
        'name': `${encodeURI(`http://localhost:5000/${req.body.username}`)}`
    }
    params['MID'] = process.env.PAYTM_MID,
        params['WEBSITE'] = process.env.PAYTM_WEBSITE,
        params['CHANNEL_ID'] = process.env.PAYTM_CHANNEL_ID,
        params['INDUSTRY_TYPE_ID'] = process.env.PAYTM_INDUSTRY_TYPE_ID,
        params['ORDER_ID'] = uuidv4(),
        params['CUST_ID'] = process.env.PAYTM_CUST_ID,
        params['TXN_AMOUNT'] = totalAmount,
        params['CALLBACK_URL'] = redirectses['name'],
        params['EMAIL'] = email,
        params['MOBILE_NO'] = ''

    /**
    * Generate checksum by parameters we have
    * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
    */
    var paytmChecksum = PaytmChecksum.generateSignature(params, process.env.PAYTM_MERCHANT_KEY);
    paytmChecksum.then(function (checksum) {
        let paytmParams = {
            ...params,
            "CHECKSUMHASH": checksum
        }
        res.json(paytmParams)
    }).catch(function (error) {
        console.log(error);
    });
})

/* paytm */


router.get('/logo', (req, res) => {
    res.sendFile(path.join(__dirname, '../logo.svg'))
})

router.post('/verification', (req, res) => {
    const secret = '12345678'

    // console.log(req.body)

    const crypto = require('crypto')

    const shasum = crypto.createHmac('sha256', secret)
    shasum.update(JSON.stringify(req.body))
    const digest = shasum.digest('hex')

    // console.log(digest, req.headers['x-razorpay-signature'])

    if (digest === req.headers['x-razorpay-signature']) {
        console.log('request is legit')
        // process it
        require('fs').writeFileSync('payment1.json', JSON.stringify(req.body, null, 4))
    } else {
        // pass it
    }
    res.json({ status: 'ok' })
})

router.post('/razorpay', async (req, res) => {
    const payment_capture = 1
    const amount = req.body.amount
    const currency = 'INR'

    const options = {
        amount: amount * 100,
        currency,
        receipt: shortid.generate(),
        payment_capture
    }

    try {
        const response = await razorpay.orders.create(options)
        // console.log(response)
        res.json({
            id: response.id,
            currency: response.currency,
            amount: response.amount
        })
    } catch (error) {
        console.log(error)
    }
})

// const stripe = require("stripe")("sk_test_51JiZbvSEkwWaUTSybkKMVmWAajqVUaUx27CF6YGVGnily52EgbMn0BlYzpbLh7CyVpRzMz00cY0WjiT1jpPLz3JA00WoFn24S5");

// router.post("/payment", (req, res) => {
//   stripe.charges.create(
//     {
//       source: req.body.tokenId,
//       amount: req.body.amount,
//       currency: "inr",
//     },
//     (stripeErr, stripeRes) => {
//       if (stripeErr) {
//           console.log(stripeErr)
//         res.status(500).json(stripeErr);
//       } else {
//         res.status(200).json(stripeRes);
//       }
//     }
//   );
// });

router.post("/getemail", async (req, res) => {
    try {
        let hello = Math.floor(100000 + Math.random() * 900000)
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'getsoftwares18@gmail.com',
                pass: 'aayushkumarjha@drf'
            }
        });

        var mailOptions = {
            from: 'deeptamresearchfoundation@gmail.com',
            to: req.body.email,
            subject: `OTP for registeration is ${hello}`,
            html: `<div>
            <pre style="font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;">Hi there,
We heared that you are registering for websiteworld to verify your account the OTP is <span style="background-color: lightgray; padding: 5px 5px 5px 5px; border-radius: 5px;">${hello}</span>
        
Use this otp to verify your account for registering for websiteworld</pre>
        </div>`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                res.send(error).status(404)
            } else {
                res.json({ otp: hello }).status(200);
            }
        });
    }
    catch {

    }
})

router.post("/getemailforforgot", async (req, res) => {
    try {
        let hello = Math.floor(100000 + Math.random() * 900000)
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            secure: false,
            auth: {
                user: process.env.USER,
                pass: process.env.PASS
            }
        });

        var mailOptions = {
            from: 'deeptamresearchfoundation@gmail.com',
            to: req.body.email,
            subject: `Forgot Password verification otp is ${hello}`,
            html: `<div>
            <pre style="font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;">Hi there,
Forgot your password ?
OTP for verify your account is <span style="background-color: lightgray; padding: 5px 5px 5px 5px; border-radius: 5px;">${hello}</span>
        
Use this otp to verify your account for registering for websiteworld</pre>
        </div>`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                res.send(error).status(404)
            } else {
                res.json({ otp: hello }).status(200);
            }
        });
    }
    catch {

    }
})

router.post("/register", async (req, res) => {
    const name = req.body.name
    const email = req.body.email
    const password = req.body.password
    const cpassword = req.body.cpassword
    const otp = req.body.otp

    if (!name, !email, !password, !cpassword, !otp) {
        return res.status(500).json({ error: `Plz fill all the fields` })
    }
    else if (password != cpassword) {
        return res.status(402).json({ error: `Password Doesn't Match` })
    }

    try {
        const userExist = await signUp.findOne({ email: email })
        if (userExist) {
            return res.status(404).json({ error: `User with ${req.body.email} is already exit` })
        }

        const user = new signUp({ name, email, password, cpassword })
        await user.save()

        res.status(201).json({ message: req.body })
    }
    catch (err) {
        res.status(404).json({ error: `${err}` })
    }
})

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email, !password) {
            return res.status(400).json({ error: `Please fill the data` })
        }
        const pass = req.body.password
        const userExist = await signUp.findOne({ email: email })
        if (userExist) {
            const isMatch = await bcrypt.compare(pass, userExist.password)
            const token = await userExist.generateAuthToken()
            if (isMatch) {
                res.status(200).json({ yourtoken: token })
            }
            else {
                res.status(400).json({ error: `Invalid Crenditials` })
            }
        }
        else {
            res.status(400).json({ error: `User not Registered` })
        }
    }
    catch (err) {
        console.log(err);
    }
})

router.post("/aboutapi", authenticate, (req, res) => {
    res.send(req.rootUser)
})

router.post("/updatepatch", authenticate, async (req, res) => {
    try {
        let name = req.body.name
        let id = req.body.id

        // const find = await signUp.findOne({_id:id})
        const update = await signUp.updateOne({ _id: id }, { name: name })
        res.status(200).json({ hi: update })
    }
    catch {
        res.status(400)
    }
})

router.post("/contactpost", async (req, res) => {
    try {
        let name = req.body.name
        let email = req.body.email
        let message = req.body.message

        // const find = await signUp.findOne({_id:id})
        if (!name || !email || message == null) {
            res.status(402).json({ error: `Please fill all the fields` })
        }
        // const hello = await signUP.findOne({ _id: req.userID })
        else {
            const update = new Contact({ name: name, email: email, message: message })
            await update.save()
            res.status(200).json({ hi: "fjlasjdfasdf" })
        }
    }
    catch (err) {
        console.log(err)
        res.status(400)
    }
})

router.patch("/updatepasspatch", authenticate, async (req, res) => {
    try {
        let id = req.body.id
        let current = req.body.current
        let pass = req.body.pass
        let cpass = req.body.cpass
        const find = await signUp.findOne({ _id: id })
        const isMatch = await bcrypt.compare(current, find.password)
        if (isMatch === true) {
            pass = await bcrypt.hash(pass, 10)
            cpass = await bcrypt.hash(cpass, 10)
            const update = await signUp.updateOne({ _id: id }, { password: pass, cpassword: cpass })
            res.status(202).json({ Match: isMatch })
        }
        else if (isMatch !== true) {
            res.status(404).json({ Match: isMatch })
        }
    }
    catch (err) {
        console.log(err)
    }
})

router.patch("/forgotpasspatch", authenticate, async (req, res) => {
    try {
        let email = req.body.email
        let otp = req.body.otp
        let pass = req.body.pass
        let cpass = req.body.cpass
        if (!email, !otp, !pass, !cpass) {
            res.status(404)
        }
        else if (pass != cpass) {
            res.status(400)
        }
        else {
            const find = await signUp.findOne({ email: email })
            pass = await bcrypt.hash(pass, 10)
            cpass = await bcrypt.hash(cpass, 10)
            const update = await signUp.updateOne({ email: email }, { password: pass, cpassword: cpass })
            res.status(202).json({ Match: "isMatch" })
        }
    }
    catch (err) {
        console.log(err)
    }
})

router.post("/gettingorder", authenticate, async (req, res) => {
    try {
        let { username, useremail, Name, desc, price, img, to, dele, orderedon } = req.body

        const neworder = new orders({ username, useremail, Name, desc, price, img, to, dele, orderedon, Download: "" })
        await neworder.save()
        let get = await orders.find({ useremail })

        res.status(201).send(get)
    }
    catch (err) {
        res.status(404).json({ nooke: "nook", error: `${err}` })
    }
})

router.post("/gettinguserorder", authenticate, async (req, res) => {
    try {
        const getorders = await orders.find({ useremail: req.rootUser.email })
        res.status(200).send(getorders)
    }
    catch {

    }
})

router.post("/completeorder", authenticate, async (req, res) => {
    try {
        const { id, date } = req.body
        const complete = await orders.updateOne({ _id: id }, { complete: true, dele: date })
        res.json({ ok: "ok" }).status(200)
    }
    catch (error) {
        res.json({ err: error }).status(400)
    }
})

router.post("/gettingproducts", async (req, res) => {
    try {
        const productses = await products.find({ hi: " " })
        res.send(productses)
    }
    catch (err) {
        res.json({ error: err })
    }
})

router.post("/chatgetid", async (req, res) => {
    try {
        const hello = await orders.find({ _id: req.body.id, useremail: req.body.useremail })
        res.send(hello).status(200)
    }
    catch (err) {
        res.send(err).status(404)
    }
})

router.post("/addmessage", async (req, res) => {
    try {
        let id = req.body.id
        const hello = await orders.updateOne({ _id: id }, { $push: { Chat: { Chatter: req.body.chatter, message: req.body.message, Time: req.body.time, Date: req.body.Date } } })
        res.send(hello).status(200)
    }
    catch (err) {
        res.send(err).status(500)
    }
})

router.post("/gettingoptioninadmin", async (req, res) => {
    try {
        const pass = req.body.pass;
        if (pass == process.env.PASSWORD) {
            res.status(202).send("Wrong")
        } else {
            res.status(404).send("Wrong")
        }
    }
    catch {
        res.status(404)
    }
})

router.post("/getthemessage", async (req, res) => {
    try {
        const pass = req.body.pass;
        if (pass == process.env.PASSWORD) {
            const hello = await Contact.find({ hi: " " })
            res.status(202).send(hello)
        } else {
            res.status(404).send("Wrong")
        }
    }
    catch {
        res.status(404)
    }
})

router.post("/gettheordersbyadmin", async (req, res) => {
    try {
        const pass = req.body.pass;
        if (pass == process.env.PASSWORD) {
            const hello = await orders.find({ hi: " " })
            res.status(202).send(hello)
        } else {
            res.status(404).send("Wrong")
        }
    }
    catch {
        res.status(404)
    }
})

router.post("/addrevision", async (req, res) => {
    try {
        const { id, password, name, href } = req.body
        if (password === process.env.PASSWORD) {
            const addrevision = await orders.updateOne({ _id: id }, { $push: { Revisions: { name, href } } })
            res.status(202).send("Wrong")
        }
    }
    catch {

    }
})

router.post("/submitdownload", async (req, res) => {
    try {
        const { id, password, link } = req.body
        if (password === process.env.PASSWORD) {
            const adddownload = await orders.updateOne({ _id: id }, { Download: link })
            res.status(202)
        }
    }
    catch {

    }
})

router.post("/submitproducts", async (req, res) => {
    try {
        const { pass, name, desc, price, src, to, dele, about } = req.body
        if (pass === process.env.PASSWORD) {
            const addorder = new products({ Name: name, desc, price, img: src, to, dele, CartAbout: about })
            await addorder.save()
            res.status(202)
        }
        else {
            res.status(404)
        }
    }
    catch {

    }
})

router.post("/chatgetidadmin", async (req, res) => {
    try {
        if (req.body.pass === process.env.PASSWORD) {
            const hello = await orders.find({ _id: req.body.id })
            res.send(hello).status(200)
        }
    }
    catch (err) {
        res.send(err).status(404)
    }
})

router.post("/chatgetidadmins", async (req, res) => {
    try {
        const hello = await orders.find({ _id: req.body.id })
        res.send(hello).status(200)
    }
    catch (err) {
        res.send(err).status(404)
    }
})

router.get("/", (req, res) => {
    res.send("Hi😃😀😀😴")
})

module.exports = router