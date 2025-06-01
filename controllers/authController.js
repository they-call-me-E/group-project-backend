const catchAsync = require("../utils/catchasync");
const {
  User,
  userPostValidationSchema,
  userPatchValidationSchema,
} = require("../models/user");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const { userWithPresignedAvatarUrl } = require("./../utils/userResponse");
const AppError = require("./../utils/apperror");
const crypto = require("crypto");
const Email = require("./../utils/email");
const { emailValidationSchema } = require("./../utils/joiValidation");
const { createSendToken } = require("../utils/createToken");

module.exports.signup = catchAsync(async (req, res, next) => {
  // modify the request body
  const reqBody = {
    ...req.body,
    sessions: {
      mobile:
        req.headers["x-device-type"] === "mobile"
          ? req.headers["x-device-id"]
          : null,
    },
  };

  // Joi validation start
  const { error: requestBodyError } =
    userPostValidationSchema.validate(reqBody);

  if (requestBodyError) {
    return next(new AppError(requestBodyError.details[0].message, 400));
  }
  // Joi validation end
  // check user is exist
  const user_info = await User.findOne({ email: reqBody?.email });
  if (user_info) {
    return next(new AppError("Email is already exist.", 400));
  }

  const newUser = await User.create(reqBody);
  // const user = userResponse(newUser);
  const user = await userWithPresignedAvatarUrl(newUser, null);
  res.status(200).json({
    user,
  });
});

module.exports.signin = catchAsync(async (req, res, next) => {
  // Joi validation start
  const { error: requestBodyError } = userPatchValidationSchema.validate({
    email: req?.body?.email,
    password: req?.body?.password,
  });

  if (requestBodyError) {
    return next(new AppError(requestBodyError.details[0].message, 400));
  }

  // Joi validation end

  const { email, password } = req.body;
  //1)Check if email and password is Not exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  //2)Check if user exist && password is correct

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }
  // If login device is mobile and new
  if (
    user.sessions.mobile &&
    user.sessions.mobile !== req?.headers["x-device-id"] &&
    req?.headers["x-device-type"] === "mobile"
  ) {
    try {
      // create 6 digit otp
      const otp = crypto.randomInt(100000, 999999).toString();
      // The validity of the OTP is 5 minutes.
      const otpExpiry = Date.now() + 3 * 60 * 1000;

      user.otp = otp;
      user.otpExpiry = otpExpiry;

      // await user.save();
      // Update user document using $set
      await User.findByIdAndUpdate(
        user._id,
        { $set: { otp: otp, otpExpiry: otpExpiry } },
        {
          new: true,
          runValidators: true,
        }
      );

      await new Email(user, null, null).sendOtp();
      return res.status(200).json({
        status: "Success",
        message: "OTP sent to email",
      });
    } catch (error) {
      return next(
        new AppError(
          "There was an error sending the email. Try again later",
          500
        )
      );
    }
  }
  //3)if everythings ok, send token to client
  createSendToken(user, 200, res);
});

//protect function implementation
module.exports.protect = catchAsync(async (req, res, next) => {
  //1)Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("you are not looged in! please login to get access.", 401)
    );
  }
  //2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) Check if user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError(
        "The user belogging to this token does no longer exist.",
        401
      )
    );
  }
  //Checkif user changed password after the token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password Please log in again", 401)
    );
  }

  // mobile device authentication code start

  if (
    freshUser.sessions.mobile &&
    freshUser.sessions.mobile !== req?.headers["x-device-id"] &&
    req?.headers["x-device-type"] === "mobile"
  ) {
    return res.status(401).json({
      token: null,
      message: "Please log in again to continue.",
    });
  }
  // mobile device authentication code end

  req.user = freshUser;
  res.locals.user = freshUser;
  return next();
});

//forgotPassword function implementation

module.exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Joi validation start
  const { error: requestBodyError } = emailValidationSchema.validate(req.body);

  if (requestBodyError) {
    return next(new AppError(requestBodyError.details[0].message, 400));
  }
  // Joi validation end
  //1) Get user based on Posted Email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("There is no user with email address", 404));
  }
  //2)Generat the random reset token
  const resetToken = user.creatPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  //3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/users/resetPassword/${resetToken}`;
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    await new Email(user, resetURL, baseUrl).sendPasswordReset();
    res.status(200).json({
      status: "Success",
      message: "Token sent to email",
      resetURL: resetURL,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the email. Try again later", 500)
    );
  }
});

module.exports.resetPassword = catchAsync(async (req, res, next) => {
  // Joi validation start
  const { error: requestBodyError } = userPatchValidationSchema.validate(
    req.body
  );

  if (requestBodyError) {
    return next(new AppError(requestBodyError.details[0].message, 400));
  }
  // Joi validation end
  //Get user based on the token

  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //if token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //4)Log the user in,send jwt
  // createSendToken(user, 200, res);

  res.status(200).json({
    message: "Password Reset Successful",
    status: "success",
  });
});
