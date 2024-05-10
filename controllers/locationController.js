const catchasync = require("./../utils/catchasync");
const { User } = require("../models/user");
const AppError = require("./../utils/apperror");

module.exports.updateLocation = catchasync(async (req, res, next) => {
  // check existing user
  const existing_user = await User.findById(req.params.id);

  if (!existing_user) {
    return next(new AppError("No user found with that Id", 404));
  }

  if (req.params.id !== JSON.stringify(req.user._id).replace(/"/g, "")) {
    return next(new AppError("You do not have permission this action", 403));
  }

  const locationBody = { location: {} };
  if (req?.body?.latitude) {
    locationBody.location.latitude = req.body.latitude;
  }
  if (req?.body?.longitude) {
    locationBody.location.longitude = req.body.longitude;
  }
  if (req?.body?.address) {
    locationBody.location.address = req.body.address;
  }

  //3)Update user document
  const updatedLocation = await User.findByIdAndUpdate(
    req.user.id,
    locationBody,
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).json({
    //user: userResponse(updatedUser),
    location: {
      ...updatedLocation.location,
    },
  });
});
