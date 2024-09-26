const catchasync = require("../utils/catchasync");
const { User } = require("../models/user");
const { userResponse } = require("../utils/userResponse");
const multer = require("multer");
const sharp = require("sharp");
const AppError = require("../utils/apperror");

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

  if (req.params.id !== req.user._id) {
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
    "email",
    "phone",
    "relation",
    "location",
    "status"
  );

  if (req.file) filteredBody.avatar = req.file.filename;

  //let new_req_body = JSON.parse(filteredBody);

  const convertedData = {
    ...filteredBody,
  };

  if (filteredBody?.location) {
    convertedData["location"] = {
      ...filteredBody.location,
    };
  }

  if (filteredBody?.status) {
    convertedData["status"] = filteredBody.status;
  }

  //3)Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, convertedData, {
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

const catchasync = require("../utils/catchasync");
const { User } = require("../models/user");
const AppError = require("../utils/apperror");

// Add Geofence Entry
module.exports.addGeofence = catchasync(async (req, res, next) => {
  const { currentGeofenceId, groupId, geofenceName } = req.body;

  // Validate the geofenceName is provided
  if (!geofenceName) {
    return next(new AppError("geofenceName is required.", 400));
  }

  // Find the user
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("No user found with that Id", 404));
  }

  // Remove any duplicate entries (oldest entry) based on currentGeofenceId and groupId
  user.geodata = user.geodata.filter(entry => !(entry.currentGeofenceId === currentGeofenceId && entry.groupId === groupId));

  // Add the new geofence entry
  const newGeofenceEntry = {
    currentGeofenceId,
    groupId,
    geofenceName,
    enteredAt: new Date()  // Set the current timestamp
  };

  user.geodata.push(newGeofenceEntry);
  await user.save();

  res.status(201).json({
    message: "geodata successfully added",
    newGeodata: newGeofenceEntry
  });
});

// Remove Geofence Entry
module.exports.removeGeofence = catchasync(async (req, res, next) => {
  const { currentGeofenceId, groupId } = req.body;

  // Find the user
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("No user found with that Id", 404));
  }

  // Filter out the geofence entry to remove
  const filteredGeodata = user.geodata.filter(
    entry => !(entry.currentGeofenceId === currentGeofenceId && entry.groupId === groupId)
  );

  // If no changes, return success message
  if (user.geodata.length === filteredGeodata.length) {
    return res.status(200).json({
      message: "geofence successfully removed"
    });
  }

  // Update the geodata
  user.geodata = filteredGeodata;
  await user.save();

  res.status(200).json({
    message: "geofence successfully removed"
  });
});

// Other user controller functions (getUser, updateUser, etc.) can go below:
