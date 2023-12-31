const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const productSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      // required: true,
    },
    description: {
      type: String,
      trim: true,
      // required: true,
    },
    isFinishBid: {
      type: Boolean,
      default: false
    },
    auctionEndTime: {
      type: Date,
      // required: true,
    },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "category" },
    brand: {
      type: String,
      trim: true,
      // required: true,
    },
    photo: {
      type: Array,
      // required: true,
    },
    price: {
      type: Number,
      // required: true,
    },
    location: {
      type: String,
      trim: true,
      // required: true,
    },
    category: {
      type: String,
      trim: true,
      // required: true,
    },
    condition: {
      type: String,
      trim: true,
      // required: true,
    },
    isPaymentDone:{
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);
const uploadProd = mongoose.model("Product", productSchema);
module.exports = uploadProd;
