const jwt = require("jsonwebtoken");
const byPassedRoutes = [
  "/user/sign-up",
  "/user/login",
  "/product/get-products",
  "/product/get-product",
  "/product/stripe/pay",
  "/product/submit",
];
const verifyToken = async(req, res, next) => {
  console.log("req.originalUrl", req.originalUrl);
  console.log('byPassedRoutes.indexOf(req.originalUrl)',byPassedRoutes.indexOf(req.originalUrl)>-1)
  console.log("check", req.originalUrl.indexOf("/user/") > -1);
  console.log("product", req.originalUrl.indexOf("/product/") > -1);
  if (
    req.originalUrl.indexOf("/user/") > -1 ||
    req.originalUrl.indexOf("/product/") > -1 ||
    req.originalUrl.indexOf("/sellerProfile/") > -1 ||
    req.originalUrl.indexOf("/buyerProfile/") > -1 ||
    req.originalUrl.indexOf("/userProfile/") > -1 ||
    req.originalUrl.indexOf("/category/") > -1 ||
    req.originalUrl.indexOf("/reviews/") > -1
  ) {
    console.log('hello')
    if (
      byPassedRoutes.indexOf(req.originalUrl) > -1 ||
      req.originalUrl.indexOf("/product/get-product") > -1 ||
      req.originalUrl.indexOf("/product/sell-fields") > -1 ||
      req.originalUrl.indexOf("/product/sell-profile") > -1 ||
      req.originalUrl.indexOf('/product/render-all-users')>-1
    ) {
      console.log('if enter')
      next();
    } else {
      console.log("else");
      console.log("req.headers", req.headers["authorization"]);
      const authHeader = req.headers["authorization"];
      console.log("authHeader", authHeader);
      const token = authHeader.split(" ")[1];
      console.log("token", token);
      if (token == null) return res.sendStatus(401);
     await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err){
         return res.sendStatus(403);
        }
        else{
          console.log('decoded auth',decoded)
          if(decoded)
          // decoded = decoded.getUserId;
          req.decoded = decoded;
          console.log('req.decoded auth',req.decoded)
        next();
        }
      });
    }
  }
};

exports.verifyToken = verifyToken;
