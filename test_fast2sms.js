const fast2smsService = require("./services/fast2smsService");
require("dotenv").config();

async function testOTP() {
    console.log("Testing Fast2SMS OTP Service...");

    if (!process.env.FAST2SMS_API_KEY) {
        console.error("Error: FAST2SMS_API_KEY is missing in .env file");
        return;
    }

    const mobileNumber = "9999999999"; // Replace with a valid number for actual testing if needed, or use a dummy
    const otp = fast2smsService.generateOTP();

    console.log(`Generated OTP: ${otp}`);
    console.log(`Sending OTP to ${mobileNumber}...`);

    const result = await fast2smsService.sendOTP(mobileNumber, otp);

    if (result.success) {
        console.log("OTP sent successfully!");
        console.log("Response:", JSON.stringify(result.data, null, 2));
    } else {
        console.error("Failed to send OTP:", result.error);
    }
}

testOTP();
