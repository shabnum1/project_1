const express = require('express');
const bodyParser = require('body-parser');
const route = require('./route/route.js');
const { default: mongoose } = require('mongoose');
const app = express(); 

app.use(bodyParser.json());

mongoose.connect("mongodb+srv://huda123:MaZjaXxcN2lw6iVV@cluster0.je5ld.mongodb.net/project1blogWebsite-db", {
    useNewUrlParser: true
})

    .then(() => console.log("MongoDb is connected"))
    .catch(err => console.log(err))

app.use('/', route);

app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});