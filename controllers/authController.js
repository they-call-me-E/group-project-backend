const catchAsync = require("../utils/catchasync");
const { User } = require("../models/user");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const { userResponse } = require("./../utils/userResponse");
const AppError = require("./../utils/apperror");

const signToken = ({ _id, role, name, email }) => {
  return jwt.sign(
    { id: _id, role: role, name: name, email: email },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user);
  user.password = undefined;
  res.status(statusCode).json({
    token,
    user: userResponse(user),
  });
};

module.exports.signup = catchAsync(async (req, res, next) => {
  // check user is exist
  const user_info = await User.findOne({ email: req?.body?.email });
  if (user_info) {
    return next(new AppError("Email is already exist.", 400));
  }
  const newUser = await User.create(req.body);
  const user = userResponse(newUser);
  res.status(200).json({
    user,
  });
});

module.exports.signin = catchAsync(async (req, res, next) => {
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
  req.user = freshUser;
  res.locals.user = freshUser;
  return next();
});
