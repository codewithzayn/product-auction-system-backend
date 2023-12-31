const path = require('path');
// import .env variables
require('dotenv').config();
module.exports = {
  emailAdd: process.env.EMAIL_ADDRESS,
  mailgunDomain: process.env.MAILGUN_DOMAIN,
  mailgunApi: process.env.MAILGUN_API_KEY,
};
