const { PrismaClient, OtpPurpose } = require("@prisma/client");
const prisma = new PrismaClient();
const expressAsyncHandler = require("express-async-handler");
const sendOtpToMail = require("../../utils/email/generateOtpAndSendMail");
const { ApiError } = require("../../utils/error/ApiError");
const { login } = require("./loginController");
const { promises } = require("nodemailer/lib/xoauth2");

// SET OTP validity in minutes
const validity = 10;

//@description     Forgot Password
//@route           POST /api/user/verifyEmail
//@access          Public
const verifyEmail = expressAsyncHandler(async (req, res, next) => {
    const { email } = req.body;

    try {
        // Validate email presence
        if (!email) {
            next(new ApiError(400, "Email is required"));
        }

        // Check if the user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            if (process.env.DEBUG === "true") {
                console.log(`User with ${ email } email verification for registration failed !! User already exist in the database`);
            }
            return next(new ApiError(400, "User already exists with this email. If you have forgot the password try reseting the password using forgot password"));
        }

        // Send OTP for email verification
        const message = await sendOtpToMail(email, OtpPurpose.EMAIL_VERIFICATION, 'registerUserOTP', 'OTP for registering on FED-KIIT', true, {}, validity);
        res.json(message);


    } catch (error) {
        if(error.statusCode === 981){
            next(new ApiError(500, "Retry after some time", error));
        }
        console.error('Error in sending OTP process:', error);
        next(new ApiError(500, "Error in sending OTP process", error));
    }
});

module.exports = { verifyEmail };
