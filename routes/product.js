const router = require("express").Router();
const { response } = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const mongoose = require("mongoose");
const Product = require("../model/product");
const Category = require("../model/category");
const Bidding = require("../model/bidding");
const User = require("../model/user");
const UserProfile = require("../model/userProfile");
const Payment = require("../model/payment");
const utils = require("./utils");
const { sendEmail } = require("./../utils/emails");
const fs = require('fs')
const data = require("../data.json")
const stripe = require("stripe")("sk_test_51N5Xu5CzvYhWZpaqx5A2vrhy2IHiZT3v81ucdy6imM4rru2nJC8UOOMTQvOpCSukGWhCBelr4g1wkIRTBY81gsDp00ebYHqsqG")
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
  .route("/upload-product")
  .post(upload.array("photo"), async (req, res) => {
    try {
      console.log("req.body", req.body);
      const title = req.body.title;
      console.log("title is", title);
      console.log("req.files", req.files);
      console.log("req.files length", req.files.length);
      const photo = req.files;
      console.log("photo", photo);

      const category = req.body.category;
      console.log("category is", category);

      const userType = req.body.userType;
      console.log("userType is", userType);

      const description = req.body.description;
      console.log("description is", description);

      const brand = req.body.brand;
      console.log("brand is", brand);
      const price = req.body.price;
      console.log("price is", price);

      const condition = req.body.condition;
      console.log("condition is", condition);

      const location = req.body.location;
      console.log("location is", location);

      const selectedDate = req.body.selectedDate;
      console.log("selectedDate is", selectedDate);
      let photos = [];
      for (let i = 0; i < req.files.length; i++) {
        photos.push(req.files[i].filename);
      }
      const addProd = {
        title,
        categoryId: category,
        description,
        brand,
        price,
        condition,
        location,
        photo: photos,
        auctionEndTime: selectedDate
      };
      const newProd = new Product(addProd);
      console.log("added product is", newProd);
      let getProductId = await newProd.save();
      console.log("getProductId", getProductId);
      getProductId = getProductId._id;
      console.log("getProductId", getProductId);
      console.log("req.decoded uploading...", req.decoded);

      const decodedEmail = req.decoded?.email;
      console.log("decodedEmail", decodedEmail);

      const decodedUserId = req.decoded?.getUserId;
      console.log("decodedUserId", decodedUserId);
      const addInitialPriceInBid = {
        userId: decodedUserId,
        productID: getProductId,
        biddingPrice: price,
        userType: userType,
      };
      console.log("addInitialPriceInBid", addInitialPriceInBid);
      const bidded = new Bidding(addInitialPriceInBid);
      console.log("bidded", bidded);
      const addSellerType = {
        userId: decodedUserId,
        productID: getProductId,
        userType,
        decodedEmail,
      };
      console.log("addSellerType", addSellerType);
      const addSeller = new UserProfile(addSellerType);
      const userSeller = await addSeller.save();
      console.log("userSeller", userSeller);
      console.log("addSeller", addSeller);
      bidded
        .save()
        .then(() => res.status(200).json({ success: true, bidded }))
        .catch((err) => res.status(400).json(err));
    } catch (error) {
      console.log("error", error);
    }
  });

router.route("/get-products").get(async (req, res) => {
  try {
    console.log("req.query", req.query);
    let { all, page, limit, title } = req.query;
    const filter = {};
    if (title && title !== "") {
      filter.title = { $regex: title, $options: "i" };
    }
    console.log("filter.title", filter.title);

    console.log("filter", filter);
    page = page !== undefined && page !== "" ? parseInt(page) : 1;
    if (!all) limit = limit !== undefined && limit !== "" ? parseInt(limit) : 20;

    let pipeline = [
      {
        $match: {
          ...filter,
          isFinishBid: { $ne: true }, // add this condition to filter by isFinishBid
        },
      },
      { $sort: { createdAt: -1 } },
    ];
    if (!all) {
      pipeline.push({ $skip: limit * (page - 1) });
      pipeline.push({ $limit: limit });
    }
    const total = await Product.countDocuments(filter);
    console.log("total", total);
    console.log("pipeline", pipeline);
    const products = await Product.aggregate(pipeline);
    console.log("products", products);
    return res.send({
      success: true,
      message: "Product fetched successfully",
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) <= 0 ? 1 : Math.ceil(total / limit),
      },
    });
  } catch (error) {
    // handle error
  }

});

router.route("/get-product/:id").get(async (req, res) => {
  try {
    const id = req.params.id;
    console.log("id join", id);
    const product = await Product.findById(id);
    console.log('product', product)
    const now = new Date();
    console.log('now', now)
    const timeLeft = Math.max(0, product.auctionEndTime - now);
    console.log('timeleft', timeLeft)
    let result = await Product.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "joinedCollection",
          pipeline: [{ $sort: { createdAt: -1 } }, { $limit: 1 }],
        },
      },
      {
        $unwind: {
          path: "$joinedCollection",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "biddings",
          localField: "_id",
          foreignField: "productID",
          as: "joinedCollection1",
          pipeline: [{ $sort: { createdAt: -1 } }, { $limit: 1 }],
        },
      },
      {
        $unwind: {
          path: "$joinedCollection1",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "userprofiles",
          localField: "joinedCollection1.userId",
          foreignField: "userId",
          as: "joinedCollection2",
          pipeline: [{ $sort: { createdAt: -1 } }, { $limit: 1 }],
        },
      },

      {
        $unwind: {
          path: "$joinedCollection2",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $addFields: {
          timeLeft: {
            $divide: [
              {
                $subtract: [
                  new Date(product.auctionEndTime),
                  new Date(),
                ],
              },
              1000,
            ],
          },
        },
      },
      {
        $addFields: {
          daysLeft: {
            $cond: {
              if: { $lt: ["$timeLeft", 0] },
              then: { $floor: { $abs: { $divide: ["$timeLeft", 86400] } } },
              else: { $floor: { $divide: ["$timeLeft", 86400] } },
            },
          },
          hoursLeft: {
            $cond: {
              if: { $lt: ["$timeLeft", 0] },
              then: { $floor: { $abs: { $mod: [{ $divide: ["$timeLeft", 3600] }, 24] } } },
              else: { $floor: { $mod: [{ $divide: ["$timeLeft", 3600] }, 24] } },
            },
          },
          minutesLeft: {
            $cond: {
              if: { $lt: ["$timeLeft", 0] },
              then: { $floor: { $abs: { $mod: [{ $divide: ["$timeLeft", 60] }, 60] } } },
              else: { $floor: { $mod: [{ $divide: ["$timeLeft", 60] }, 60] } },
            },
          },
          secondsLeft: {
            $cond: {
              if: { $lt: ["$timeLeft", 0] },
              then: { $floor: { $abs: { $mod: ["$timeLeft", 60] } } },
              else: { $floor: { $mod: ["$timeLeft", 60] } },
            },
          },
        },
      },



      {
        $project: {
          categoryId: "$joinedCollection._id",
          categoryTitle: "$joinedCollection.title",
          title: 1,
          description: 1,
          auctionEndTime: 1,
          timeLeft: 1,
          brand: 1,
          price: 1,
          photo: 1,
          condition: 1,
          location: 1,
          biddingUserId: "$joinedCollection1.userId",
          biddingPrice: "$joinedCollection1.biddingPrice",
          userType: "$joinedCollection2.userType",
          userId: "$joinedCollection2.userId",
          email: "$joinedCollection2.email",
          name: "$joinedCollection2.name",
          daysLeft: 1,
          hoursLeft: 1,
          minutesLeft: 1,
          secondsLeft: 1,
        },
      },
      { $limit: 1 },
    ]);
    console.log("results get-product", result);
    res.status(200).json(result);
  } catch (error) {
    console.log("error", error);
  }
});

router.route("/add-bidding").post(async (req, res) => {
  const updatedBiddingPrice = req.body.updatedBiddingPrice;
  const productID = req.body.productID;
  console.log("updatedBiddingPrice....", updatedBiddingPrice);
  console.log("productID...", productID);

  const decodedUserId = req.decoded?.getUserId;
  console.log("decodedUserId add bidding", decodedUserId);

  const addBid = {
    userId: decodedUserId,
    biddingPrice: updatedBiddingPrice,
    productID,
  };
  console.log("addBid", addBid);

  const bidded = new Bidding(addBid);
  console.log("added product is", bidded);
  bidded
    .save()
    .then(() => res.status(200).json({ success: true, bidded }))
    .catch((err) => res.status(400).json(err));
});

router.route("/is-bid-allow/:id").get(async (req, res) => {
  const id = req.params.id;
  console.log("id join", id);
  // console.log("req.headers[authorization]", req.headers["authorization"]);
  // console.log("req.headers", req.headers);
  if (req.headers["authorization"] == "Bearer null") {
    console.log("bearerToken null");
    return res.status(400).json({ message: "token is null" });
  }
  const decodedEmail = req.decoded?.email;
  console.log("decodedEmail", decodedEmail);

  const decodedUserId = req.decoded?.getUserId;
  console.log("decodedUserId", decodedUserId);
  const checkBidAllow = await UserProfile.find({
    userId: decodedUserId,
    productID: id,
  });
  console.log("checkBidAllow", checkBidAllow);
  res.status(200).json(checkBidAllow);
});

router.route("/render-all-users/:id").get(async (req, res) => {
  try {
    const id = req.params.id;
    console.log("id join", id);
    let result = await Product.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "biddings",
          localField: "_id",
          foreignField: "productID",
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
        $lookup: {
          from: "users",
          localField: "joinedCollection1.userId",
          foreignField: "_id",
          as: "joinedCollection2",
        },
      },
      {
        $unwind: {
          path: "$joinedCollection2",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: "$joinedCollection2._id",
          title: 1,
          description: 1,
          brand: 1,
          price: 1,
          photo: 1,
          condition: 1,
          location: 1,
          biddingUserId: "$joinedCollection1.userId",
          biddingPrice: "$joinedCollection1.biddingPrice",
          email: "$joinedCollection2.email",
          name: "$joinedCollection2.name",
        },
      },
    ]);
    console.log("results render all users.", result);
    res.status(200).json(result);
  } catch (error) {
    console.log("error", error);
  }
});

router.route("/user-profile").get(async (req, res) => {
  console.log("req.decoded routes", req.decoded);
  const getUserId = req.decoded.getUserId;
  console.log("getUserId user-profile", getUserId);
  try {
    let result = await User.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(getUserId),
        },
      },
      {
        $lookup: {
          from: "biddings",
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
        $match: {
          "joinedCollection1.userType": { $ne: 1 },
        },
      },

      {
        $lookup: {
          from: "products",
          localField: "joinedCollection1.productID",
          foreignField: "_id",
          as: "joinedCollection2",
        },
      },
      {
        $unwind: {
          path: "$joinedCollection2",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "joinedCollection2.isFinishBid": false,
        },
      },


      {
        $group: {
          _id: "$joinedCollection2._id",
          photo: { $first: "$joinedCollection2.photo" },
        },
      },
      {
        $match: {
          _id: { $ne: null },
        },
      },
    ]);
    console.log("results. user profile", result);
    res.status(200).json(result);
  } catch (error) {
    console.log("error", error);
  }
});

router.route("/sell-profile/:id").get(async (req, res) => {
  let id = req.params.id;
  console.log("id seller-fields", id);
  try {
    let result = await User.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "biddings",
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
        $match: {
          "joinedCollection1.userType": { $eq: 1 },
        },
      },

      {
        $lookup: {
          from: "products",
          localField: "joinedCollection1.productID",
          foreignField: "_id",
          as: "joinedCollection2",
        },
      },
      {
        $unwind: {
          path: "$joinedCollection2",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "joinedCollection2.isFinishBid": false,
        },
      },
      {
        $group: {
          _id: "$joinedCollection2._id",
          photo: { $first: "$joinedCollection2.photo" },
        },
      },
      {
        $match: {
          _id: { $ne: null },
        },
      },
    ]);
    console.log("results. sell-profile", result);
    res.status(200).json(result);
  } catch (error) {
    console.log("error", error);
  }
});

router.route("/sell-fields/:id").get(async (req, res) => {
  let id = req.params.id;
  console.log("id seller-fields", id);
  try {
    let resultSellerFields = await User.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(id),
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
        },
      },
    ]);
    console.log("result sell-fields.", resultSellerFields);
    res.status(200).json(resultSellerFields);
  } catch (error) {
    console.log("error", error);
  }
});

router.route("/seller-profile").get(async (req, res) => {
  console.log("req.decoded routes", req.decoded);
  const getUserId = req.decoded.getUserId;
  console.log("getUserId user-profile", getUserId);
  try {
    let result = await User.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(getUserId),
        },
      },
      {
        $lookup: {
          from: "biddings",
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
        $match: {
          "joinedCollection1.userType": { $eq: 1 },
        },
      },

      {
        $lookup: {
          from: "products",
          localField: "joinedCollection1.productID",
          foreignField: "_id",
          as: "joinedCollection2",
        },
      },
      {
        $unwind: {
          path: "$joinedCollection2",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "joinedCollection2.isFinishBid": false,
        },
      },
      {
        $group: {
          _id: "$joinedCollection2._id",
          photo: { $first: "$joinedCollection2.photo" },
        },
      },
      {
        $match: {
          _id: { $ne: null },
        },
      },
    ]);
    console.log("results seller-profile", result);
    res.status(200).json(result);
  } catch (error) {
    console.log("error", error);
  }
});

router.route("/seller-fields").get(async (req, res) => {
  // let id = req.params.id;
  // console.log('id seller-fields', id)
  console.log("req.decoded routes", req.decoded);
  const getUserId = req.decoded.getUserId;
  console.log("getUserId user-profile", getUserId);
  try {
    let resultSellerFields = await User.aggregate([
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
    console.log("result seller-fields.", resultSellerFields);
    res.status(200).json(resultSellerFields);
  } catch (error) {
    console.log("error", error);
  }
});
function findObjectsWithHighestPrice(objects) {
  console.log("objects", objects);
  const highestPrice = objects.reduce((acc, obj) => {
    return obj.biddingPrice > acc ? obj.biddingPrice : acc;
  }, 0);
  console.log("highestPrice", highestPrice);
  const objectsWithHighestPrice = objects.filter(
    (obj) => obj.biddingPrice === highestPrice
  );
  return objectsWithHighestPrice;
}
router.route("/finish-bid").put(async (req, res) => {
  let renderUser = req.body?.render;
  const id = req.body?.id;
  console.log("id finish-bid", id);
  console.log("render finih bid", renderUser);
  let isFinishBid = await Product.findOneAndUpdate(
    { _id: id },
    { $set: { isFinishBid: true, isPaymentDone: true } }
  );

  console.log("isFinishBid", isFinishBid);
  renderUser = JSON.parse(renderUser);
  console.log("renderUser parse", renderUser);
  const findWithHighestBid = await utils(renderUser);

  console.log("findWithHighestBid", findWithHighestBid);
  const decodedEmail = req.decoded?.email;
  console.log("decodedEmail", decodedEmail);

  const decodedUserId = req.decoded?.getUserId;
  console.log("decodedUserId", decodedUserId);
  // console.log('sendEmail',sendEmail)
  console.log("process.env.EMAIL_ADDRESS", process.env.EMAIL_ADDRESS);
  for (let i = 0; i < Object.keys(findWithHighestBid).length; i++) {
    console.log("part", findWithHighestBid[i].email);
    sendEmail(
      findWithHighestBid[i].email,
      "DemoEmail",
      {
        email: findWithHighestBid[i].email,
        url: `${findWithHighestBid[i].biddingPrice}`,
      },
      "Bid Wining Confirmation"
    );
  }


  return res.send({
    status: true,
    message: findWithHighestBid,
  });
});

router.route("/stripe/pay").post(async (req, res) => {
  console.log(req.body.token);
  const { token, amount, paymentId } = req.body;
  console.log('token', token)
  console.log('amount', amount)
  console.log('paymentId', paymentId)
  const idempotencyKey = uuidv4();
  console.log('idempotencyKey', idempotencyKey)
  return stripe.customers.create({
    email: token.email,
    source: token
  }).then(customer => {
    stripe.charges.create({
      amount: amount * 100,
      currency: 'usd',
      customer: customer.id,
      receipt_email: token.email
    }, { idempotencyKey })
  }).then(async result => {
    console.log('result', result)

    let isFinishBid = await Payment.findOneAndUpdate(
      { _id: paymentId },
      { $set: { isFinalPayment: true } }
    );
    res.status(200).json(result)
  }).catch(err => {
    console.log(err)
  })
});


router.route("/recommended-product").post(async (req, res) => {
  const { category, id } = req.body
  console.log('id', id)
  console.log('category', category)

  try {
    let recommendedProducts = await Product.aggregate([
      {
        $match: {
          isFinishBid: { $ne: true },
          _id: { $ne: id }
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "joinedCollection",
        },
      },
      {
        $unwind: {
          path: "$joinedCollection",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "biddings",
          localField: "_id",
          foreignField: "productID",
          as: "joinedCollection1",
          pipeline: [{ $sort: { createdAt: -1 } }, { $limit: 1 }],
        },
      },
      {
        $unwind: {
          path: "$joinedCollection1",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "userprofiles",
          localField: "joinedCollection1.userId",
          foreignField: "userId",
          as: "joinedCollection2",
          pipeline: [{ $sort: { createdAt: -1 } }, { $limit: 1 }],
        },
      },

      {
        $unwind: {
          path: "$joinedCollection2",
          preserveNullAndEmptyArrays: true,
        },
      },



      {
        $match: {
          _id: { $ne: mongoose.Types.ObjectId(id) }, // Exclude the product with the specified _id
        },
      },
      {
        $project: {
          categoryId: "$joinedCollection._id",
          title: 1,
          description: 1,
          price: 1,
          location: 1,
          categoryTitle: "$joinedCollection.title",
          condition: 1,
          brand: 1,
          biddingUserId: "$joinedCollection1.userId",
          biddingPrice: "$joinedCollection1.biddingPrice",
          userType: "$joinedCollection2.userType",
          userId: "$joinedCollection2.userId",
          email: "$joinedCollection2.email",
          name: "$joinedCollection2.name",
          photo: 1,
        }
      }
    ]);
    console.log("recommendedProducts.", recommendedProducts);
    res.status(200).json(recommendedProducts);
  } catch (error) {
    console.log("error", error);
  }
});


router.route("/submit").post(async (req, res) => {
  try {
    console.log('req.body', req.body)
    let existingData = [];
    existingData = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    const obj = req.body;
    console.log('obj', obj)
    existingData.push(obj);
    // console.log('JSON.stringify(data)',JSON.stringify(data))
    // fs.writeFileSync('data.json', JSON.stringify(data));
    fs.writeFileSync('data.json', JSON.stringify(existingData));
    res.status(200).json(existingData);
  } catch (error) {
    console.log("error", error);
  }
});
module.exports = router;
