const axios = require("axios");

class Fast2SmsService {
    constructor() {
        this.apiKey = 'Q4oaLdeG710b5NAS2p8CMKxEi3qVgI96tlrcJyuzYXBZTPjWUmRg1uGXSiw206qQodyOWma8TLH7kJA5';
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
                    route: "otp",
                    variables_values: otp,
                    message: `Your JoJo verification code is: ${otp}. This code will expire in 5 minutes.`,
                    language: "english",
                    flash: 0,
                    numbers: mobileNumber,
                },
                {
                    headers: {
                        authorization: this.apiKey,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log(response, "otp response")

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
