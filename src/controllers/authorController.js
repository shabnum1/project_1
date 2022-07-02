const authorModel = require("../models/authorModel")
const jwt = require("jsonwebtoken");
const validate = require("validator")


const isValid = (value) => {

  if (typeof value === 'undefined' || value === null) return false

  if (typeof value === 'string' && value.trim().length === 0) {
    return false
  }
    return true

}


const isValidTitle = (title) => {
  return ['Mr', 'Mrs', 'Miss', 'Mast'].indexOf(title) !== -1
}

const isValidRequestBody = (requestBody) => {
  return Object.keys(requestBody).length > 0
}

// ----------------------------------------- CREATE AUTHOR ---------------------------------------------------------


const createAuthor = async function (req, res) {
  try {

    //--------------------------  Getting data from body  -------------------------------------
    let requestBody = req.body;

    if (!isValidRequestBody(requestBody)) {
      return res.status(400).send({ status: false, msg: "invalid request parameters . Please Provide Author Details" })
    }
    // -------------------------- Checking for all the fields --------------------------------
    
 ////--------- Extracting Params------------ ////

 const { fname, lname, title, email, password } = requestBody;

 ////------------Validating------////

 if (!isValid(fname)) {
   res.status(400).send({ Status: false, message: "First Name is required" })
   return
 }

 if (!isValid(lname)) {
   res.status(400).send({ Status: false, message: "Last Name is required" })
   return
 }

 if (!isValid(title)) {
   res.status(400).send({ Status: false, message: "Title is required" })
   return
 }

 if (!isValidTitle(title)) {
   res.status(400).send({ Status: false, message: "Title Should Be Among Mr , Mrs , Miss And Mast" })
   return
 }

 if (!isValid(email)) {
   res.status(400).send({ Status: false, message: "Email is required" })
   return
 }

 if (!validate.isEmail(email)) {
   return res.status(400).send({ status: false, msg: "Invalid Email" })
 }

 if (!isValid(password)) {
   res.status(400).send({ Status: false, message: "Password Is Required" })
   return
 }

 
 const isEmailAlreadyUsed = await authorModel.findOne( { email } );

 if (isEmailAlreadyUsed) {
   res.status(400).send({ Status: false, message: `${email} is Already Registerd` })
   return
 }

 let authorCreated = await authorModel.create(requestBody)
 res.status(201).send({ status: true, Message: "New author created successfully", requestBody: authorCreated })

} catch (err) {
  res.status(500).send( { Status: false, message: err.message } )
}

}

// ----------------------------------------- GET AUTHOR ------------------------------------------------------------

const getAuthor = async function (req, res) {
  let alldata = await authorModel.find()
  res.status(201).send({ status: true, data: alldata })
}

// --------------------------------------- AUTHOR LOGIN ------------------------------------------------------------

const authorLogin = async function (req, res) {
  try {
    let userName = req.body.emailId;
    let password = req.body.password;

    let user = await authorModel.findOne({ emailId: userName, password: password });
    if (!userName && !password) {
      return res.status(400).send({ status: false, msg: "Data is required" })
    }
    if (!user) {
      return res.status(401).send({ status: false, msg: "INVALID CREDENTIALS" });
    }

    let payload = { _id: user._id }                      //Setting the payload
    let token = jwt.sign(payload, "BloggingWebsite");
    res.setHeader("x-api-key", token);
    res.send({ status: true, token: token });
  } catch (error) {
    res.status(500).send({ staus: false, msg: error.message })
  }
};

module.exports.createAuthor = createAuthor;
module.exports.getAuthor = getAuthor
module.exports.authorLogin = authorLogin