const emailTemplates = {
    forgotPassword: "<p>To reset your password click this link:</p><p>&nbsp;${url}</p><p>If you didn’t ask to reset your password, you can ignore this email.</p><p>Thanks,</p>",
    DemoEmail: "<p>Hello ${email} :</p><p>Congratulations </p><p>&nbsp; You won the bidding ${url}</p><p>If you already check your email, you can ignore this email.</p><p>Thanks,</p>"
}

exports.templates = async (key) => {
    return emailTemplates[key] || "";
}