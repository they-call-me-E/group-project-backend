const catchAsync = require("../utils/catchasync");
const AppError = require("./../utils/apperror");
const { User } = require("../models/user");

module.exports.isSuperUserOnly = catchAsync(async (req, res, next) => {
  if (req?.user?.superuser) {
    req.superuser = true;
    return next();
  }
  req.superuser = false;
  return next();
});
