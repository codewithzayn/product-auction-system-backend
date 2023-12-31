require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http").Server(app);
const cors = require("cors"); // added
const connectDB = require("./config/keys.js");
const middleware = require("../CLIENT/middleware/auth.js");

const users = require("./routes/user.js");
const products = require("./routes/product.js")
const userProfile = require("./routes/userProfile.js")
const category = require("./routes/category.js")
const review = require("./routes/reviewsRatings.js")
// connect database
connectDB();

// cors
app.use(cors({ origin: "*", credentials: true })); // added
// initialize middleware
app.use("/images", express.static(__dirname + "/images"));
app.use(express.json({ extended: false }));

app.use(middleware.verifyToken);
app.use("/user", users);
app.use("/product",products)
app.use("/userProfile",userProfile)
app.use("/category",category)
app.use("/reviews",review)

app.get("/", (req, res) => res.send("Server up and running"));
const PORT = process.env.PORT;
http.listen(PORT, () => {
  console.log(`server is running on http://127.0.0.1:${PORT}`);
});
