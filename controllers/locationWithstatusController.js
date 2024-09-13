const catchasync = require("./../utils/catchasync");
const { User } = require("../models/user");
const AppError = require("./../utils/apperror");

module.exports.updateLocationWithStatus = catchasync(async (req, res, next) => {
  // check existing user
  const existing_user = await User.findById(req.params.id);

  if (!existing_user) {
    return next(new AppError("No user found with that Id", 404));
  }

  if (req.params.id !== JSON.stringify(req.user._id).replace(/"/g, "")) {
    return next(new AppError("You do not have permission this action", 403));
  }

  // status updated code start

  const statusBody = { status: { device: {} } };
  if (req?.body?.status?.location_sharing) {
    statusBody.status.location_sharing = req?.body?.status?.location_sharing;
  }
  if (req?.body?.status?.isMoving) {
    statusBody.status.isMoving = req?.body?.status?.isMoving;
  }
  if (req?.body?.status?.speed) {
    statusBody.status.speed = req?.body?.status?.speed;
  }

  if (req?.body?.status?.device?.screen) {
    statusBody.status.device.screen = req?.body?.status?.device?.screen;
  }

  if (req?.body?.status?.device?.wifi) {
    statusBody.status.device.wifi = req?.body?.status?.device?.wifi;
  }

  if (req?.body?.status?.device?.battery_level) {
    statusBody.status.device.battery_level =
      req?.body?.status?.device?.battery_level;
  }

  if (req?.body?.status?.device?.charging) {
    statusBody.status.device.charging = req?.body?.status?.device?.charging;
  }
  // status updated code end
  // location updated code start

  // location updated code end
  const locationBody = { location: {} };
  if (req?.body?.location?.latitude) {
    locationBody.location.latitude = req.body.location.latitude;
  }
  if (req?.body?.location?.longitude) {
    locationBody.location.longitude = req.body.location.longitude;
  }
  if (req?.body?.location?.address) {
    locationBody.location.address = req.body.location.address;
  }

  //3)Update user document
  const updatedLocationWithStatus = await User.findByIdAndUpdate(
    req.user.id,
    { ...locationBody, ...statusBody },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).json({
    //user: userResponse(updatedUser),
    locationWithStatus: {
      status: updatedLocationWithStatus.status,
      location: updatedLocationWithStatus.location,
    },
  });
});
