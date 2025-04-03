const router = require("express").Router();
const { response } = require("express");
const mongoose = require("mongoose");
const user = require("../model/user");
const userProfile = require("../model/userProfile");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const emailValidator = require('deep-email-validator');

// async function isEmailValid(email) {
//   return emailValidator.validate(email)
// }

router.route("/sign-up").post(async (req, res) => {
  console.log("req.body", req.body);
  const name = req.body.name;
  console.log("name is", name);
  const email = req.body.email;
  console.log("email is", email);
  // const { valid, reason, validators } = await isEmailValid(email);
  // console.log("valid", valid)


  let password = req.body.password;
  console.log("password is", password);
  let confirmPassword = req.body.confirmPassword;
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "passwords doesn't match" });
  }
  const salt = await bcrypt.genSalt();
  console.log("salt is", salt);
  const hashPassword = await bcrypt.hash(password, salt);
  console.log("hashPassword is", hashPassword);
  password = hashPassword;
  console.log("password hash is", password);

  const addUser = {
    name,
    email,
    password,
  };
  const newUser = new user(addUser);
  console.log("adde user is", newUser);

   const getUserId = newUser?._id
  // const getname = newUser?.name
  // const getEmail = newUser?.email
  // const data = {
  //   userId: getuserId,
  //   name: getname,
  //   email: getEmail
  // }
  // const buyerUser = new userProfile(data);
  // await buyerUser.save()
  // console.log("add userProfile is", buyerUser);

  const accessToken = jwt.sign(
    { name, email, getUserId },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1345635s",
    }
  );
  console.log("accessToken", accessToken);
  newUser
    .save()
    .then(() => res.status(200).json({ success: true, token: accessToken, addUser }))
    .catch((err) => res.status(400).json(err));
});
router.route("/login").post(async (req, res) => {
  console.log("req.body", req.body);
  const email = req.body.email;
  console.log("email is", email);
  const password = req.body.password;
  console.log("password is", password);
  const loginUser = await user.findOne({
    email: email,
  });
  console.log("loginUser is", loginUser);
  if (!loginUser) {
    return res.status(401).json({ message: "Email not match" });
  }
  const match = await bcrypt.compare(password, loginUser.password);
  console.log("match is", match);
  if (!match) {
    return res.status(401).json({ message: "password not match" });
  }

  const getUserId = loginUser._id
  console.log('getUserId', getUserId)
  // Sign token
  var accessToken = jwt.sign(
    { email, password, getUserId },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1345635s",
    }
  );
  console.log("accessToken", accessToken);
  res.json({ success: true, token: accessToken, loginUser });
});

router
.route("/get-buyer-profile-data")
.get(async (req, res) => {
    const { getUserId } = req.decoded;
    console.log('getUserId get buyer reviews', getUserId)
    console.log('req.decoded', req.decoded)
    try {
        // let getBuyerData = await user.find(
        //     { _id: getUserId},
        // );

        try {
          let getBuyerData = await user.aggregate([
            {
              $match: {
                _id: mongoose.Types.ObjectId(getUserId),
              },
            },
            {
              $lookup: {
                from: "userprofiles",
                localField: "_id",
                foreignField: "userId",
                as: "joinedCollection1",
              },
            },
            {
              $unwind: {
                path: "$joinedCollection1",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                name: 1,
                email: 1,
                phone: "$joinedCollection1.mobile",
                city: "$joinedCollection1.city",
                country: "$joinedCollection1.country"
              },
            },
          ]);
          console.log("result seller-fields.", getBuyerData);
          res.status(200).json(getBuyerData);
        } catch (error) {
          console.log("error", error);
        }
    } catch (error) {
        console.log("error", error);
    }
});
module.exports = router;
