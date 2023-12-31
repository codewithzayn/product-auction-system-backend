const { emailAdd, mailgunDomain, mailgunApi } = require("../config/vars");
const { templates } = require("../config/templates");

//send email to mentioned users
exports.sendEmail = async (
  email = "",
  type = "",
  content = null,
  subject = ""
) => {
  console.log('email...',email)
  if (email !== "") {
    const getTemplate = await templates(type);
console.log('getTemplate',getTemplate)
console.log('mailgunApi',mailgunApi)
console.log('mailgunDomain',mailgunDomain)
    if (getTemplate) {
      var mailgun = require("mailgun-js")({
        apiKey: mailgunApi,
        domain: mailgunDomain,
      });
      console.log('mailgun',mailgun)
      console.log('emailAdd',emailAdd)
      const msg = {
        to: email,
        from: emailAdd,
        subject,
        html: getHtml(getTemplate, content),
      };
       console.log('msg',msg)
      mailgun.messages().send(msg, function (err, body) {
        if (err) {
          console.log('error',err)
        } else {
          console.log(body);
        }
      });
    }
  }
};

function getHtml(text, content) {
  if (content) {
    for (let key in content) {
      text = text.replace(`${key}`, "'" + `${content[key]}` + "'");
    }
  }
  return text;
}
