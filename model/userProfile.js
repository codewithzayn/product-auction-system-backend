const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const userProfileSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },

    email: {
      type: String,
      //   required: true,
    },

    mobile: {
      type: String,
      //   required: true,
    },

    city: {
      type: String,
      // required: true,
    },

    country: {
      type: String,
      // required: true,
    },
    productID: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    description: {
      type: String,
      // required: true,
    },
    userType: {
      type: Number,
    },
    photo: {
      type: String,
    },
  },
  { timestamps: true }
);
const userProfile = mongoose.model("userprofile", userProfileSchema);
module.exports = userProfile;
