const router = require("express").Router();
const { response } = require("express");
const Category = require("../model/category");
const Product = require("../model/product");

// import { Router } from "express";
// import { response } from "express";
// import Category from "../model/category.js";
// import Product from "../model/product.js";

// const router = Router();
router
  .route("/upload-Category")
  .post(async (req, res) => {


    const title = req.body.title;
    console.log("title", title);
    const description = req.body.description;
    console.log("description", description);
    const addCategory = {
      title,
      description,
      //    photo
    }
    console.log('obj', addCategory)
    const newCategory = new Category(addCategory);
    console.log("added Category is", newCategory);
    let getCategoryId = await newCategory.save();
    console.log('getCategoryId', getCategoryId)

    res.status(200).json(getCategoryId)
  });


router.route("/get-all-categories").get(async (req, res) => {
  const getAllCategory = await Category.find({})
  console.log('getAllCategory', getAllCategory)
  res.status(200).json(getAllCategory)
})

router.route("/get-all-categ-products").get(async (req, res) => {
  try {
    let result = await Product.aggregate([
      {
        $match: {
          isFinishBid: false, 
        }
      },
      {
        
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "joinedCollection1",
        }
      },
      {
        $unwind: { path: "$joinedCollection1", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: "$joinedCollection1._id",
          categoryTitle: { $first: "$joinedCollection1.title" },
          products: {
            $push: {
              _id: "$_id",
              title: "$title",
              description: "$description",
              brand: "$brand",
              price: "$price",
              photo: "$photo",
              condition: "$condition",
              location: "$location"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          categoryId: "$_id",
          categoryTitle: 1,
          products: 1
        }
      }
    ]);
    console.log('results get-all-categ-products.', result)
    res.status(200).json(result)
  } catch (error) {
    console.log("error", error);
  }
})
module.exports = router