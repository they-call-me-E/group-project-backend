module.exports.updateLocationWithStatus = catchasync(async (req, res, next) => {
  // Check existing user
  const existing_user = await User.findById(req.params.id);

  if (!existing_user) {
    return next(new AppError("No user found with that Id", 404));
  }

  if (req.params.id !== JSON.stringify(req.user._id).replace(/"/g, "")) {
    return next(new AppError("You do not have permission for this action", 403));
  }

  // Status updated code start
  const statusBody = { status: { device: {} } };

  if (req?.body?.status?.location_sharing !== undefined && req?.body?.status?.location_sharing !== null) {
    statusBody.status.location_sharing = req.body.status.location_sharing;
  }

  if (req?.body?.status?.isMoving !== undefined && req?.body?.status?.isMoving !== null) {
    statusBody.status.isMoving = req.body.status.isMoving;
  }

  if (req?.body?.status?.speed !== undefined && req?.body?.status?.speed !== null) {
    statusBody.status.speed = req.body.status.speed;
  }

  if (req?.body?.status?.device?.screen !== undefined && req?.body?.status?.device?.screen !== null) {
    statusBody.status.device.screen = req.body.status.device.screen;
  }

  if (req?.body?.status?.device?.wifi !== undefined && req?.body?.status?.device?.wifi !== null) {
    statusBody.status.device.wifi = req.body.status.device.wifi;
  }

  if (req?.body?.status?.device?.battery_level !== undefined && req?.body?.status?.device?.battery_level !== null) {
    statusBody.status.device.battery_level = req.body.status.device.battery_level;
  }

  if (req?.body?.status?.device?.charging !== undefined && req?.body?.status?.device?.charging !== null) {
    statusBody.status.device.charging = req.body.status.device.charging;
  }
  // Status updated code end

  // Location updated code start
  const locationBody = { location: {} };

  if (req?.body?.location?.latitude !== undefined && req?.body?.location?.latitude !== null) {
    locationBody.location.latitude = req.body.location.latitude;
  }

  if (req?.body?.location?.longitude !== undefined && req?.body?.location?.longitude !== null) {
    locationBody.location.longitude = req.body.location.longitude;
  }

  if (req?.body?.location?.address !== undefined && req?.body?.location?.address !== null) {
    locationBody.location.address = req.body.location.address;
  }
  // Location updated code end

  // Update user document
  const updatedLocationWithStatus = await User.findByIdAndUpdate(
    req.user.id,
    { ...locationBody, ...statusBody },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    locationWithStatus: {
      status: updatedLocationWithStatus.status,
      location: updatedLocationWithStatus.location,
    },
  });
});