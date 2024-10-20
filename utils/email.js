const pug = require("pug");
const { convert } = require("html-to-text");
const sgMail = require("@sendgrid/mail");

module.exports = class Email {
  constructor(user, url, baseUrl) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `${process.env.EMAIL_FROM}`;
    this.baseUrl = baseUrl;
  }

  // Send the actual email start
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      front_end_url: `${this.baseUrl}/${
        process.env.WEBSITE_RESET_PASSWORD_URL
      }?token=${this.url.substring(this.url.lastIndexOf("/") + 1)}`,
      subject,
      url: this.url,
    });

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html),
    };

    if (process.env.NODE_ENV === "production") {
      // 3) Create a transport and send email
      sgMail.setApiKey(process?.env?.SENDGRID_API_KEY);
      await sgMail.send(mailOptions);
    }
  }
  // Send the actual email end

  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your password reset token (valid for only 30 minutes)"
    );
  }
};
