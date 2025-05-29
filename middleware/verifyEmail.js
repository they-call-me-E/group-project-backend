const { User, userPatchValidationSchema } = require("./../models/user");
const AppError = require("./../utils/apperror");
const { createSendToken } = require("../utils/createToken");
const Joi = require("joi");

const schema = Joi.object({
  "x-device-id": Joi.string().required(),
});

module.exports.verifyEmail = async (req, res, next) => {
  // Joi validation start
  const headers = {
    "x-device-id": req?.headers["x-device-id"],
  };
  const { error: deviceIdError } = schema.validate(headers);
  if (deviceIdError) {
    return next(new AppError(deviceIdError.details[0].message, 400));
  }

  const { error: requestBodyError } = userPatchValidationSchema.validate(
    req.body
  );

  if (requestBodyError) {
    return next(new AppError(requestBodyError.details[0].message, 400));
  }
  // Joi validation end

  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email: email });

    if (user.otp !== otp || new Date(user.otpExpiry).getTime() < Date.now()) {
      return next(new AppError("Invalid or expired OTP", 400));
    }
    if (!user) return res.status(404).json({ message: "User not found" });
    if (
      req?.headers["x-device-id"] &&
      req?.headers["x-device-type"] === "mobile"
    ) {
      await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            otp: undefined,
            otpExpiry: undefined,
            isVerified: true,
            sessions: { mobile: headers["x-device-id"] },
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );
    } else {
      return next(
        new AppError(
          "Invalid or missing device headers. Please verify your input.",
          400
        )
      );
    }

    //3)if everythings ok, send token to client
    createSendToken(user, 200, res);
    // res.status(200).json({ message: "Device verified successfully" });
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
