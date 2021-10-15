const mongoose = require('mongoose')

mongoose.connect(process.env.DB_KEY, {
    useNewUrlParser: true, useUnifiedTopology: true,
    useCreateIndex:true,useFindAndModify:false
}).then(() => console.log('connection succes')).catch((err) => console.log("No"))