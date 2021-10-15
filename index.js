const express = require('express')
const app = express()
require('dotenv').config()
const cors = require("cors")
app.use(cors({
    origin:"*"
}))

const port = process.env.PORT || 5000

app.use(express.json())

app.use(require("./router/auth"))

app.listen(port, () => {
})