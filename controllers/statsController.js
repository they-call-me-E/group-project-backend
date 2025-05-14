const catchAsync = require("../utils/catchasync");
const AppError = require("../utils/apperror");
const { User } = require("../models/user");
const { Group } = require("../models/group");
const { Fences } = require("../models/fences");

const getCollectionStats = catchAsync(async (req, res, next) => {
  // Get total counts for each collection
  const userCount = await User.countDocuments();
  const groupCount = await Group.countDocuments();
  const fencesCount = await Fences.countDocuments();

  // Send response
  res.status(200).json({
    status: "success",
    data: {
      totalUsers: userCount,
      totalGroups: groupCount,
      totalFences: fencesCount,
    },
  });
});

module.exports = { getCollectionStats };
//statsController.js
