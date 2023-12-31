const router = require("express").Router();
const { response } = require("express");
const UserProfile = require("../model/userProfile");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images");
  },
  filename: function (req, file, cb) {
    console.log("file", file);
    cb(null, uuidv4() + "-" + Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
let upload = multer({ storage, fileFilter });

router
  .route("/edit-user-profile")
  .put(upload.single("photo"), async (req, res) => {
    console.log('req.body', req.body)
    console.log('req.decoded routes', req.decoded)
    const { getUserId } = req.decoded
    console.log('getUserId', getUserId)

    if (req.file) {
      console.log("if")
      var photo = req.file.filename;
    }
    else {
      console.log("else")
      photo = req.body.photo === "undefined" ? "" : req.body.photo
    }

    let payload = req.body;
    console.log('payload', payload)

    const name = req.body.name;
    console.log("name", name);

    const mobile = req.body.mobile;
    console.log("mobile", mobile);

    const city = req.body.city;
    console.log("city", city);

    const country = req.body.country;
    console.log("country", country);
    const obj = {
      name,
      mobile,
      city,
      country,
      photo
    }
    console.log('obj', obj)
    const nonEmptyFields = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && obj[key]) {
        nonEmptyFields[key] = obj[key];
      }
    }
    console.log("nonEmptyFields", nonEmptyFields)

    UserProfile.updateMany({ userId: getUserId }, { $set: nonEmptyFields }, { multi: true }, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Not updated" });
      }
      if (result.nModified === 0) {
        return res.status(404).json({ message: "No documents found to update" });
      }
      console.log('result', result)
      res.status(200).json({ data: obj })

    });
  });
module.exports = router;
