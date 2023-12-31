const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const reviewSchem = new Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "userprofile" },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "payment" },
    rating: {
      type: Number
    },
    review: {
      type: String
    },
    isRatingDone: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);
const reviewRatings = mongoose.model("review", reviewSchem);
module.exports = reviewRatings;
