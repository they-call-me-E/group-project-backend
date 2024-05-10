const catchasync = require("./../utils/catchasync");
const { User } = require("../models/user");
const { userResponse } = require("./../utils/userResponse");
const multer = require("multer");
const sharp = require("sharp");
const AppError = require("./../utils/apperror");

// update user photo information code start
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
module.exports.uploadUserPhoto = upload.single("avatar");

module.exports.resizeUserPhoto = catchasync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  return next();
});
// update user photot information code end

// update user information controller function
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
module.exports.updateUser = catchasync(async (req, res, next) => {
  // check existing user
  const existing_user = await User.findById(req.params.id);

  if (!existing_user) {
    return next(new AppError("No user found with that Id", 404));
  }

  if (req.params.id !== JSON.stringify(req.user._id).replace(/"/g, "")) {
    return next(new AppError("You do not have permission this action", 403));
  }

  //1)Create error if user Posts password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("This route is not for password updates.", 400));
  }
  //2) Filtered out unwanted fields name that are not allowed to be updated
  const filteredBody = filterObj(
    req.body,
    "name",
    "phone",
    "relation",
    "location",
    "status"
  );
  if (req.file) filteredBody.avatar = req.file.filename;

  //3)Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    user: userResponse(updatedUser),
  });
});

// delete user information controller function

module.exports.deleteUser = catchasync(async function (req, res, next) {
  if (req.params.id !== JSON.stringify(req.user._id).replace(/"/g, "")) {
    return next(new AppError("You do not have permission this action", 403));
  }
  // check existing user
  const existing_user = await User.findById(req.params.id);

  if (!existing_user) {
    return next(new AppError("No user found with that Id", 404));
  }

  const user = await User.findByIdAndDelete(req.user.id);
  if (!user) {
    return next(new AppError("No user found with that Id", 404));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});

// read all users information

module.exports.getAllUsers = catchasync(async function (req, res, next) {
  const users = await User.find({});

  res.status(200).json({
    users: users.map((item) => {
      return userResponse(item);
    }),
  });
});
// read single user information

module.exports.getUser = catchasync(async function (req, res, next) {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("No User found with that Id", 404));
  }
  res.status(200).json({
    user: userResponse(user),
  });
});
