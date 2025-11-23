// services/twilioService.js
const twilio = require("twilio");

class TwilioService {
  constructor() {
    this.client = twilio(
      process.env.TWILIOACCOUNTSID,
      process.env.TWILIOAUTHTOKEN
    );
  }

  // Generate random OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP via SMS
  async sendOTP(mobileNumber, otp) {
    try {
      const message = await this.client.messages.create({
        body: `Your JoJo verification code is: ${otp}. This code will expire in 5 minutes.`,
        from: process.env.TWILIOPHONENUMBER,
        to: mobileNumber,
      });

      return { success: true, messageId: message.sid };
    } catch (error) {
      console.error("Error sending OTP:", error);
      return { success: false, error: error.message };
    }
  }

  // Verify OTP (simple comparison for demo)
  async verifyOTP(storedOTP, enteredOTP) {
    return storedOTP === enteredOTP;
  }
}

module.exports = new TwilioService();
