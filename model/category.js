const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const categorySchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      unique: true,
    },
    
    description: {
      type: String,
      trim: true,
      // required: true,
    },

  },
  { timestamps: true }
);
const uploadCategory = mongoose.model("category", categorySchema);
module.exports = uploadCategory;
