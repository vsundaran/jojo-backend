const axios = require("axios");

class Fast2SmsService {
    constructor() {
        this.apiKey = process.env.FAST2SMS_API_KEY;
        this.baseUrl = "https://www.fast2sms.com/dev/bulkV2";
    }

    // Generate random OTP
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Send OTP via Fast2SMS
    async sendOTP(mobileNumber, otp) {
        try {
            if (!this.apiKey) {
                throw new Error("Fast2SMS API Key is missing");
            }

            const response = await axios.post(
                this.baseUrl,
                {
                    route: "q",
                    message: `Your JoJo verification code is: ${otp}. This code will expire in 5 minutes.`,
                    language: "english",
                    flash: 0,
                    numbers: mobileNumber,
                },
                {
                    headers: {
                        authorization: "NLSVmRQUZFJAx4vWoDnKekdgB1j3MXpOH28uhrbzw7GCI059Yf7PFGnZCBpzmKOoSy6Yvdikg1EHA3hX",
                        "Content-Type": "application/json",
                    },
                }
            );

            return { success: true, data: response.data };
        } catch (error) {
            console.error("Error sending OTP via Fast2SMS:", error.response?.data || error.message);
            return { success: false, error: error.message };
        }
    }

    // Verify OTP (simple comparison)
    async verifyOTP(storedOTP, enteredOTP) {
        return storedOTP === enteredOTP;
    }
}

module.exports = new Fast2SmsService();
