const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const paymentSchema = new Schema(
    {
        buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "userprofile" },

        isFinalPayment: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);
const payment = mongoose.model("payment", paymentSchema);
module.exports = payment;
