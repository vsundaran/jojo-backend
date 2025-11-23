// services/acsSmsService.js
const { SmsClient } = require("@azure/communication-sms");

class ACSSmsService {
  constructor() {
    this.client = new SmsClient(
      process.env.AZURECOMMUNICATIONSERVICECONNECTIONSTRING
    );
  }

  // Generate random OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP using Azure ACS SMS
  async sendOTP(mobileNumber, otp) {
    try {
      const result = await this.client.send({
        from: process.env.ACS_PHONE_NUMBER, // Example: "+18335551234"
        to: [mobileNumber],
        message: `Your JoJo verification code is: ${otp}. This code will expire in 5 minutes.`,
      });

      const sms = result[0];

      if (!sms.successful) {
        return { success: false, error: sms.errorMessage };
      }

      return { success: true, messageId: sms.messageId };
    } catch (error) {
      console.error("ACS SMS Send Error:", error);
      return { success: false, error: error.message };
    }
  }

  // Compare OTP
  verifyOTP(storedOTP, enteredOTP) {
    return storedOTP === enteredOTP;
  }
}

module.exports = new ACSSmsService();
