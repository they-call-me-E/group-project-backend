const catchAsync = require("../utils/catchasync");
const AppError = require("./../utils/apperror");
const { User } = require("../models/user");

module.exports.updateLocationWithStatus = catchAsync(async (req, res, next) => {
  const isValidField = (field) => field !== undefined && field !== null;

  const existing_user = await User.findById(req.params.id);
  if (!existing_user) {
    return next(new AppError("No user found with that ID", 404));
  }

  if (req.params.id !== req.user._id.toString()) {
    return next(new AppError("You do not have permission for this action", 403));
  }

  const updateFields = {};

  if (isValidField(req.body.relation)) {
    updateFields["relation"] = req.body.relation;
  }

  let locationUpdated = false;
  if (isValidField(req.body.location?.latitude)) {
    updateFields["location.latitude"] = req.body.location.latitude;
    locationUpdated = true;
  }
  if (isValidField(req.body.location?.longitude)) {
    updateFields["location.longitude"] = req.body.location.longitude;
    locationUpdated = true;
  }
  if (isValidField(req.body.location?.address)) {
    updateFields["location.address"] = req.body.location.address;
    locationUpdated = true;
  }

  // Update timestamp if location fields are modified
  if (locationUpdated) {
    updateFields["location.timestamp"] = Date.now();
  }

  if (isValidField(req.body.status?.location_sharing)) {
    updateFields["status.location_sharing"] = req.body.status.location_sharing;
  }
  if (isValidField(req.body.status?.isMoving)) {
    updateFields["status.isMoving"] = req.body.status.isMoving;
  }
  if (isValidField(req.body.status?.speed)) {
    updateFields["status.speed"] = req.body.status.speed;
  }

  const deviceStatus = req.body.status?.device;
  if (deviceStatus) {
    if (isValidField(deviceStatus.screen)) {
      updateFields["status.device.screen"] = deviceStatus.screen;
    }
    if (isValidField(deviceStatus.wifi)) {
      updateFields["status.device.wifi"] = deviceStatus.wifi;
    }
    if (isValidField(deviceStatus.battery_level)) {
      updateFields["status.device.battery_level"] = deviceStatus.battery_level;
    }
    if (isValidField(deviceStatus.charging)) {
      updateFields["status.device.charging"] = deviceStatus.charging;
    }
    if (isValidField(deviceStatus.currentApp)) {
      updateFields["status.device.currentApp"] = deviceStatus.currentApp;
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updateFields },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    user: {
      status: updatedUser.status,
      location: updatedUser.location,
      relation: updatedUser.relation,
    },
  });
});