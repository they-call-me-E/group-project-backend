const catchAsync = require("../utils/catchasync");
const AppError = require("./../utils/apperror");
const { User } = require("../models/user");
const { Group } = require("../models/group");
const { userWithPresignedAvatarUrl } = require("../utils/userResponse");

module.exports.updateLocationWithStatus = catchAsync(async (req, res, next) => {
  // Check existing user
  const existing_user = await User.findById(req.params.id);

  if (!existing_user) {
    return next(new AppError("No user found with that Id", 404));
  }

  if (req.params.id !== req.user._id.toString()) {
    return next(
      new AppError("You do not have permission for this action", 403)
    );
  }

  // Build the update object using dot notation
  const updateFields = {};

  // Main body fields
  if (req.body.relation !== undefined && req.body.relation !== null) {
    updateFields["relation"] = req.body.relation;
  }

  // Location fields
  if (
    req.body.location?.latitude !== undefined &&
    req.body.location.latitude !== null
  ) {
    updateFields["location.latitude"] = req.body.location.latitude;
  }
  if (
    req.body.location?.longitude !== undefined &&
    req.body.location.longitude !== null
  ) {
    updateFields["location.longitude"] = req.body.location.longitude;
  }
  if (
    req.body.location?.address !== undefined &&
    req.body.location.address !== null
  ) {
    updateFields["location.address"] = req.body.location.address;
  }

  // Status fields
  if (
    req.body.status?.location_sharing !== undefined &&
    req.body.status.location_sharing !== null
  ) {
    updateFields["status.location_sharing"] = req.body.status.location_sharing;
  }
  if (
    req.body.status?.isMoving !== undefined &&
    req.body.status.isMoving !== null
  ) {
    updateFields["status.isMoving"] = req.body.status.isMoving;
  }
  if (
    req.body.status?.movingStatus !== undefined &&
    req.body.status.movingStatus !== null
  ) {
    updateFields["status.movingStatus"] = req.body.status.movingStatus;
  }
  if (req.body.status?.speed !== undefined && req.body.status.speed !== null) {
    updateFields["status.speed"] = req.body.status.speed;
  }

  // Status.device fields
  if (
    req.body.status?.device?.screen !== undefined &&
    req.body.status.device.screen !== null
  ) {
    updateFields["status.device.screen"] = req.body.status.device.screen;
  }
  if (
    req.body.status?.device?.wifi !== undefined &&
    req.body.status.device.wifi !== null
  ) {
    updateFields["status.device.wifi"] = req.body.status.device.wifi;
  }
  if (
    req.body.status?.device?.battery_level !== undefined &&
    req.body.status.device.battery_level !== null
  ) {
    updateFields["status.device.battery_level"] =
      req.body.status.device.battery_level;
  }
  if (
    req.body.status?.device?.charging !== undefined &&
    req.body.status.device.charging !== null
  ) {
    updateFields["status.device.charging"] = req.body.status.device.charging;
  }
  if (
    req.body.status?.device?.currentApp !== undefined &&
    req.body.status.device.currentApp !== null
  ) {
    updateFields["status.device.currentApp"] =
      req.body.status.device.currentApp;
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

  // socket code start
  const io = req.app.get("socketio");
  const userGroups = await Group.find({
    members: { $in: [updatedUser._id] },
  });

  const userInfo = await userWithPresignedAvatarUrl(updatedUser);

  userGroups.forEach((group) => {
    io.to(group._id).emit("userLocationUpdated", {
      // userId: updatedUser._id,
      // location: updatedUser.location,
      // status: updatedUser.status,
      userInfo,
    });
  });
  // socket code end

  res.status(200).json({
    user: {
      status: updatedUser.status,
      location: updatedUser.location,
      relation: updatedUser.relation,
    },
  });
});
