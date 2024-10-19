const catchasync = require("../utils/catchasync");
const { User } = require("../models/user");
const { userResponse } = require("../utils/userResponse");
const multer = require("multer");
const sharp = require("sharp");
const AppError = require("./../utils/apperror");
const { Group } = require("../models/group");
const { Fences } = require("../models/fences");

// ... [other code]

// update user information controller function
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

module.exports.updateUser = catchasync(async (req, res, next) => {
  // Check existing user
  const existing_user = await User.findById(req.params.id);

  if (!existing_user) {
    return next(new AppError("No user found with that Id", 404));
  }

  if (req.params.id !== req.user._id) {
    return next(new AppError("You do not have permission this action", 403));
  }

  // Create error if user posts password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("This route is not for password updates.", 400));
  }

  // Filter out unwanted fields
  const allowedFields = [
    "name",
    "email",
    "phone",
    "relation",
    "location",
    "status",
  ];
  const filteredBody = filterObj(req.body, ...allowedFields);

  if (req.file) filteredBody.avatar = req.file.filename;

  // Build the updateFields object using dot notation
  const updateFields = {};

  // Simple fields
  if (filteredBody.name !== undefined) updateFields["name"] = filteredBody.name;
  if (filteredBody.email !== undefined)
    updateFields["email"] = filteredBody.email;
  if (filteredBody.phone !== undefined)
    updateFields["phone"] = filteredBody.phone;
  if (filteredBody.relation !== undefined)
    updateFields["relation"] = filteredBody.relation;
  if (filteredBody.avatar !== undefined)
    updateFields["avatar"] = filteredBody.avatar;

  // Location fields
  if (filteredBody.location) {
    if (filteredBody.location.latitude !== undefined)
      updateFields["location.latitude"] = filteredBody.location.latitude;
    if (filteredBody.location.longitude !== undefined)
      updateFields["location.longitude"] = filteredBody.location.longitude;
    if (filteredBody.location.address !== undefined)
      updateFields["location.address"] = filteredBody.location.address;
  }

  // Status fields
  if (filteredBody.status) {
    if (filteredBody.status.location_sharing !== undefined)
      updateFields["status.location_sharing"] =
        filteredBody.status.location_sharing;
    if (filteredBody.status.isMoving !== undefined)
      updateFields["status.isMoving"] = filteredBody.status.isMoving;
    if (filteredBody.status.speed !== undefined)
      updateFields["status.speed"] = filteredBody.status.speed;

    if (filteredBody.status.device) {
      if (filteredBody.status.device.screen !== undefined)
        updateFields["status.device.screen"] =
          filteredBody.status.device.screen;
      if (filteredBody.status.device.wifi !== undefined)
        updateFields["status.device.wifi"] = filteredBody.status.device.wifi;
      if (filteredBody.status.device.battery_level !== undefined)
        updateFields["status.device.battery_level"] =
          filteredBody.status.device.battery_level;
      if (filteredBody.status.device.charging !== undefined)
        updateFields["status.device.charging"] =
          filteredBody.status.device.charging;
      if (filteredBody.status.device.currentApp !== undefined)
        updateFields["status.device.currentApp"] =
          filteredBody.status.device.currentApp;
    }
  }

  // Update user document using $set
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updateFields },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    user: userResponse(updatedUser),
  });
});