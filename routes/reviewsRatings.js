const router = require("express").Router();
const { response } = require("express");
const utils = require('./utils');
const mongoose = require("mongoose");

const ReviewRatings = require("../model/reviewsRating");
const Bidding = require("../model/bidding");
const Category = require("../model/category");
const Product = require("../model/product");
const Payment = require("../model/payment");


// router
//     .route("/add-review")
//     .post(async (req, res) => {
//         console.log('req.body add-review', req.body)
//         let { render, id } = req.body;
//         console.log('render add reviews', render);
//         console.log('id', id);
//         render = JSON.parse(render)
//         console.log('render add reviews after parse', render);
//         const getSellerId = render[0]?._id
//         console.log('getSellerId', getSellerId)
//         const findWithHighestBid = await utils(render)
//         console.log('findWithHighestBid review', findWithHighestBid)
//         const getBuyerId = findWithHighestBid[0]?._id
//         console.log('getBuyerId', getBuyerId)
//         const addReview = {
//             sellerId: getSellerId,
//             buyerId: getBuyerId,
//             productId: id,
//         };
//         const addRating = new ReviewRatings(addReview);
//         console.log("addRating is", addRating);
//         let getaddReview = await addRating.save();
//         console.log("getaddReview is", getaddReview);

//         res.status(200).json({ message: getaddReview })
//     });

const addReview = async (getBuyerReviews) => {
    const paymentId = getBuyerReviews._id;
    console.log('paymentId addReview', paymentId)
    let getPaymentReview = await ReviewRatings.findOne({ paymentId: paymentId })
    console.log('getBuyerReviews', getBuyerReviews)
    if (getPaymentReview?.isRatingDone === true)
        return 0;
    console.log('addReview', getBuyerReviews);
    const getSellerId = getBuyerReviews.sellerId
    console.log('getSellerId addReview', getSellerId)
    const getBuyerId = getBuyerReviews.buyerId
    console.log('getBuyerId addReview', getBuyerId)
    const id = getBuyerReviews.productId
    console.log('id addReview', id)
    const getDeleted = await ReviewRatings.deleteOne( { paymentId :paymentId } );
    console.log('getDeleted',getDeleted)
    const addReview = {
        sellerId: getSellerId,
        buyerId: getBuyerId,
        productId: id,
        paymentId: paymentId,
    };
    const addRating = new ReviewRatings(addReview);
    console.log("addRating is", addRating);
    let getaddReview = await addRating.save();
    console.log("getaddReview is", getaddReview);
    return getaddReview;
}
router
    .route("/get-buyer-reviews")
    .post(async (req, res) => {
        const paymentId = req.body.paymentId
        console.log('req.body add-buyer-review', paymentId)
        console.log('req.body add-review', req.decoded)
        const { getUserId } = req.decoded;
        console.log('getUserId get buyer reviews', getUserId)
        let getBuyerReviews = await Payment.findOne({ _id: paymentId, isFinalPayment: true })
        console.log('getBuyerReviews', getBuyerReviews)
        if (getBuyerReviews !== null) {
            const getAddReview = await addReview(getBuyerReviews);
            console.log('getAddReview', getAddReview)
            let resultBuyerReviews = await ReviewRatings.aggregate([
                {
                    $match: {
                        buyerId: mongoose.Types.ObjectId(getUserId),
                        isRatingDone: false
                    }
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "productId",
                        foreignField: "_id",
                        as: "joinedCollection",

                    }
                },
                {
                    $unwind: { path: "$joinedCollection", preserveNullAndEmptyArrays: true },
                },
                {
                    $project: {
                        _id: 1,
                        sellerId: 1,
                        buyerId: 1,
                        productId: "$joinedCollection._id",
                        photo: "$joinedCollection.photo"
                    }
                },
                {
                    $match: {
                        sellerId: { $ne: mongoose.Types.ObjectId(getUserId) },
                    },
                },
            ])
            console.log('results resultBuyerReviews', resultBuyerReviews)
            res.status(200).json(resultBuyerReviews);
        }
        else {
            console.log('results getBuyerReviews', getBuyerReviews)
            res.status(200).json(getBuyerReviews);
        }
    });


router
    .route("/get-payments")
    .get(async (req, res) => {
        console.log('req.body get-payment', req.decoded)
        const { getUserId } = req.decoded;
        console.log('getUserId get payments', getUserId)
        try {
            let resultGetPayments = await Payment.aggregate([
                {
                    $match: {
                        buyerId: mongoose.Types.ObjectId(getUserId),
                        isFinalPayment: false
                    }
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "productId",
                        foreignField: "_id",
                        as: "joinedCollection",
                    }
                },
                {
                    $unwind: { path: "$joinedCollection", preserveNullAndEmptyArrays: true },
                },

                {
                    $lookup: {
                        from: "biddings",
                        let: { product_id: "$joinedCollection._id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ["$productID", "$$product_id"] }
                                }
                            },
                            {
                                $group: {
                                    _id: "$productID",
                                    highestBiddingPrice: { $max: "$biddingPrice" }
                                }
                            }
                        ],
                        as: "bidding"
                    }
                },
                {
                    $unwind: { path: "$bidding", preserveNullAndEmptyArrays: true },
                },
                {
                    $project: {
                        _id: 1,
                        sellerId: 1,
                        buyerId: 1,
                        productId: "$joinedCollection._id",
                        photo: "$joinedCollection.photo",
                        highestBiddingPrice: "$bidding.highestBiddingPrice"
                    }
                },
                {
                    $match: {
                        sellerId: { $ne: mongoose.Types.ObjectId(getUserId) },
                    },
                },
            ])
            console.log('results get payments', resultGetPayments)
            res.status(200).json(resultGetPayments);
        } catch (error) {
            console.log("error", error);
        }
    });


router
    .route("/give-rating")
    .put(async (req, res) => {
        try {
            let { review, rating, id } = req.body;
            console.log('rating', rating)
            console.log('reviews', review)
            let updateratingReview = await ReviewRatings.findOneAndUpdate(
                { _id: id },
                { $set: { "review": review, "rating": rating, isRatingDone: true } },
            );
            console.log('updateratingReview', updateratingReview)
            res.status(200).json(updateratingReview);
        } catch (error) {
            console.log("error", error);
        }
    });


function calculate_rating(getSellerReview) {
    let findAverage;
    let sum = 0;
    let count = 0;
    let length = Object.keys(getSellerReview).length;
    for (let i = 0; i < length; i++) {
        if (getSellerReview[i].rating !== null) {
            sum += getSellerReview[i].rating;
            count++;
        }
    }
    console.log('sum', sum);

    if (count > 0) {
        findAverage = Math.floor(sum / count);
    } else {
        findAverage = 0;
    }
    console.log('findAverage', findAverage);
    return findAverage;

    // let findAverage;
    // let sum = 0;
    // let length = Object.keys(getSellerReview).length
    // for (let i = 0; i < length; i++) {
    //     sum = sum + getSellerReview[i].rating;
    // }
    // console.log('sum', sum)

    // findAverage = sum / length;
    // console.log('findAverage', findAverage)
    // findAverage = Math.floor(findAverage)
    // return findAverage;
}

const joinTables = async (id) => {
    const isRatingDone = false;

    let results = await ReviewRatings.aggregate([
        {
            $match: {
                sellerId: mongoose.Types.ObjectId(id),
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "buyerId",
                foreignField: "_id",
                as: "joinedCollection",

            }
        },
        {
            $unwind: { path: "$joinedCollection", preserveNullAndEmptyArrays: true },
        },

        {
            $project: {
                _id: 1,
                // rating: 1,
                // review: 1,
                sellerId: 1,
                userId: "$joinedCollection._id",
                name: { $cond: { if: "$isRatingDone", then: "$joinedCollection.name", else: null } },
                email: { $cond: { if: "$isRatingDone", then: "$joinedCollection.email", else: null } },
                rating: { $cond: { if: "$isRatingDone", then: "$rating", else: null } },
                review: { $cond: { if: "$isRatingDone", then: "$review", else: null } },
                // ...(isRatingDone
                //     ? { name: "$joinedCollection.name", email: "$joinedCollection.email", rating: 1, review: 1 }
                //     : {}),
                // name: "$joinedCollection.name",
                // email: "$joinedCollection.email"
            }
        },
    ])
    console.log('results join tables', results)
    return results;
}
router
    .route("/get-review-rating/:id")
    .get(async (req, res) => {
        try {
            let { id } = req.params;
            console.log('id get-review-rating', id)
            let getReviewSellerId = await joinTables(id)
            console.log('getReviewSellerId', getReviewSellerId)
            if (Object.keys(getReviewSellerId).length > 0) {
                console.log('if')
                const findAverage = await calculate_rating(getReviewSellerId)
                console.log('findAverage', findAverage)
                const obj = {
                    getReviewSellerId,
                    findAverage
                }
                res.status(200).json(obj);
            }
            else {
                console.log('else')
                let getReviewSellerId = await ReviewRatings.findOne({ productId: id })
                console.log('getReviewRating', getReviewSellerId)
                if (getReviewSellerId) {
                    let sellerId = getReviewSellerId?.sellerId;
                    console.log('sellerId', sellerId)
                    getReviewSellerId = await joinTables(sellerId)
                    console.log('getReviewSellerId', getReviewSellerId)
                    const findAverage = await calculate_rating(getReviewSellerId)
                    console.log('findAverage', findAverage)
                    const obj = {
                        getReviewSellerId,
                        findAverage
                    }
                    res.status(200).json(obj);
                }
                res.status(200).json(getReviewSellerId);
            }
        } catch (error) {
            console.log("error", error);
        }
    });

router
    .route("/notify-rating")
    .get(async (req, res) => {
        const { getUserId } = req.decoded;
        console.log('getUserId get buyer reviews', getUserId)
        console.log('req.decoded', req.decoded)
        try {
            let notify = await ReviewRatings.find(
                {
                    buyerId: getUserId, isRatingDone: false, sellerId: { $ne: getUserId }
                },
            );
            console.log('notify', notify)
            res.status(200).json(notify);
        } catch (error) {
            console.log("error", error);
        }
    });

router.route("/add-payment").post(async (req, res) => {
    const { sellerId, id, buyerId } = req.body
    console.log('sellerId add payment', sellerId)
    console.log('id add payment', id)
    console.log('buyerId add payment', buyerId)
    const addPayment = {
        sellerId: sellerId,
        buyerId: buyerId,
        productId: id,
    };
    const payment = new Payment(addPayment);
    console.log("payment is", payment);
    let getaddPayment = await payment.save();
    console.log("getaddPayment is", getaddPayment);
    const obj = {
        paymentId: getaddPayment._id
    }
    const paymentReview = new ReviewRatings(obj);
    console.log("paymentReview is", paymentReview);
    let getaddPaymentReview = await paymentReview.save();
    console.log('getaddPaymentReview', getaddPaymentReview)
    res.status(200).json({ message: getaddPayment })
})
router.route("/notify-payment").post(async (req, res) => {
    console.log('notify payment...')
    const { getUserId } = req.decoded;
    console.log('getUserId notify-payment', getUserId)
    console.log('req.decoded', req.decoded)
    console.log("req.body.notify payment", req.body)
    const { getIdForPayment } = req.body
    console.log('getIdForPayment', getIdForPayment)
    try {
        let notifyPayment = await Payment.find(
            {
                buyerId: getUserId, productId: getIdForPayment, isFinalPayment: false, sellerId: { $ne: getUserId }
            },
        );
        console.log('notifyPayment', notifyPayment)
        res.status(200).json(notifyPayment);
    } catch (error) {
        console.log("error", error);
    }

})

router.route("/make-chart").get(async (req, res) => {
    try {
        let result = await Product.aggregate([
            // Join the categories collection
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "category"
                }
            },
            { $unwind: "$category" },
            // Join the biddings collection
            {
                $lookup: {
                    from: "biddings",
                    localField: "_id",
                    foreignField: "productID",
                    as: "bidding"
                }
            },
            { $unwind: "$bidding" },

            {
                $group: {
                    _id: {
                        category: "$category.title",
                        product: "$_id"
                    },
                    count: { $sum: 1 }
                }
            },
            // Group by category to sum product counts
            {
                $group: {
                    _id: "$_id.category",
                    products: {
                        $push: {
                            product: "$_id.product",
                            count: "$count"
                        }
                    },
                    total: { $sum: "$count" }
                }
            },
            // Project the output fields
            {
                $project: {
                    _id: 0,
                    category: "$_id",
                    products: 1,
                    total: 1
                }
            }


        ]);

        console.log('result make-chart', result);
        res.status(200).json(result);
    } catch (err) {
        console.log('err', err);
    }
})
module.exports = router