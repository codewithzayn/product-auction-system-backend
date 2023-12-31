const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const bidding = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    productID:{ type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    biddingPrice: {
      type: Number,
    },
    userType:{
      type:Number,
    }
  },
  { timestamps: true }
);
const bid = mongoose.model("bidding", bidding);
module.exports = bid;
