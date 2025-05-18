const catchAsync = require("../utils/catchasync");
const AppError = require("./../utils/apperror");
const { User } = require("../models/user");
const { userWithPresignedAvatarUrl } = require("../utils/userResponse");
const multer = require("multer");
const sharp = require("sharp");
const { Group } = require("../models/group");
const { Fences } = require("../models/fences");
const fs = require("fs");
const path = require("path");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { BUCKET_NAME, s3 } = require("./../utils/awsS3");
const { Avatar } = require("./../models/avatar");

// Update user photo information code start

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
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB size limit
});

const uploadUserPhoto = upload.single("avatar");
const resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next(); // No file uploaded, proceed to next middleware

  const filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  // Resize and convert image to buffer
  const processedImage = await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toBuffer();

  // Check if user exists in the database
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  if (req.params.id !== req.user._id.toString()) {
    return next(
      new AppError("You do not have permission for this action", 403)
    );
  }

  // Delete the user's existing avatar from S3, if it exists
  if (user.avatar) {
    const oldImageKey = user.avatar; // Extract key from URL
    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: `users/${oldImageKey}`,
    };

    try {
      await s3.send(new DeleteObjectCommand(deleteParams));
    } catch (err) {
      return next(new AppError("Failed to delete old image from AWS S3", 500));
    }
  }

  // Upload the new image to S3
  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: `users/${filename}`,
    Body: processedImage,
    ContentType: "image/jpeg",
  };

  try {
    await s3.send(new PutObjectCommand(uploadParams));
    req.body.avatar = `${filename}`;
    next();
  } catch (err) {
    console.error("Error uploading new image to S3:", err);
    return next(new AppError("Failed to upload new image to AWS S3", 500));
  }
});

// Update user photo information code end

// Filter object utility function
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Update user information controller function
const updateUser = catchAsync(async (req, res, next) => {
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
    "avatar",
  ];
  const filteredBody = filterObj(req.body, ...allowedFields);

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
    if (filteredBody.status.movingStatus !== undefined)
      updateFields["status.movingStatus"] = filteredBody.status.movingStatus;
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

  // const avatarInfo = await Avatar.findOne({ ownerID: updatedUser._id });

  const userInfo = await userWithPresignedAvatarUrl(
    updatedUser,
    // avatarInfo?.avatar
    null
  );

  // save avatar in database
  if (userInfo) {
    await Avatar.deleteOne({ ownerID: userInfo.uuid });
    await Avatar.create({ avatar: userInfo.avatar, ownerID: userInfo.uuid });
  }

  res.status(200).json({
    user: userInfo,
  });
});

// Delete user information controller function
const deleteUser = catchAsync(async (req, res, next) => {
  if (req.params.id !== req.user._id.toString()) {
    return next(
      new AppError("You do not have permission for this action", 403)
    );
  }

  // Check existing user
  const existing_user = await User.findById(req.params.id);

  if (!existing_user) {
    return next(new AppError("No user found with that Id", 404));
  }

  const user = await User.findByIdAndDelete(req.user.id);
  if (!user) {
    return next(new AppError("No user found with that Id", 404));
  }

  // If the user already has a profile image, remove the old one (code start)
  if (existing_user.avatar) {
    const oldImagePath = path.join(
      __dirname,
      "../public/img/users/",
      existing_user.avatar
    );
    fs.unlink(oldImagePath, (err) => {
      if (err) {
        return next(new AppError("Failed to remove old image", 500));
      }
    });
  }

  // If the user already has a profile image, remove the old one (code end)

  res.status(204).json({
    status: "success",
    data: null,
  });
});

const usersWithUrls = async (users) => {
  const userIds = users.map((user) => user._id);

  const avatarInfos = await Avatar.find({ ownerID: { $in: userIds } });

  const avatarMap = new Map();
  avatarInfos.forEach((avatar) => {
    avatarMap.set(avatar.ownerID.toString(), avatar.avatar);
  });

  const usersWithUrls = users.map(async (user) => {
    const avatarKey = avatarMap.get(user._id.toString());
    return await userWithPresignedAvatarUrl(user, avatarKey);
  });

  return Promise.all(usersWithUrls);
};

// Read all users information
const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({});

  // const usersWithPresignedUrls = await Promise.all(
  //   users.map(async (item) => {
  //     const presignedUrl = await getPresignedUrl(`users/${item.avatar}`);
  //     return {
  //       ...userResponse(item),
  //       avatar: presignedUrl,
  //     };
  //   })
  // );

  // return res.status(200).json({ users: usersWithPresignedUrls });
  // const usersWithUrls = await Promise.all(
  //   users.map(async (user) => {
  //     const avatarInfo = await Avatar.findOne({ ownerID: updatedUser._id });

  //     return await userWithPresignedAvatarUrl(user, avatarInfo?.avatar);
  //   })
  // );

  const result = await usersWithUrls(users);

  res.status(200).json({
    users: result,
  });
});

// Read single user information
const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  let avatar = "";
  if (!user) {
    return next(new AppError("No User found with that Id", 404));
  }

  const avatarInfo = await Avatar.findOne({ ownerID: user._id });

  const userInfo = await userWithPresignedAvatarUrl(user, avatarInfo?.avatar);

  res.status(200).json({
    user: userInfo,
  });
});

// Add Geofence Entry
const addGeofence = catchAsync(async (req, res, next) => {
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

  // Check currentGeofenceId is valid or not
  const checkFenceId = await Fences.findById(currentGeofenceId);
  if (!checkFenceId) {
    return next(new AppError("No currentGeofence found with that Id", 404));
  }

  // Check groupId is valid or not
  const checkGroupId = await Group.findById(groupId);
  if (!checkGroupId) {
    return next(new AppError("No group found with that Id", 404));
  }

  // Remove any duplicate entries based on currentGeofenceId and groupId
  user.geodata = user.geodata.filter(
    (entry) =>
      !(
        entry.currentGeofenceId === currentGeofenceId &&
        entry.groupId === groupId
      )
  );

  // Add the new geofence entry
  const newGeofenceEntry = {
    currentGeofenceId,
    groupId,
    geofenceName,
    enteredAt: new Date(), // Set the current timestamp
  };

  user.geodata.push(newGeofenceEntry);

  // Save the updated user document
  // await user.save();
  await User.findByIdAndUpdate(
    user._id,
    { geodata: user.geodata },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    message: "geodata successfully added",
    geoData: user.geodata.map((item) => {
      return {
        currentGeofenceId: item.currentGeofenceId,
        groupId: item.groupId,
        geofenceName: item.geofenceName,
        enteredAt: item.enteredAt,
      };
    }),
  });
});

// Remove Geofence Entry
const removeGeofence = catchAsync(async (req, res, next) => {
  const { currentGeofenceId, groupId } = req.body;

  // Find the user
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("No user found with that Id", 404));
  }

  // Check if the geofence entry exists
  const geofenceIndex = user.geodata.findIndex(
    (item) =>
      item.currentGeofenceId === currentGeofenceId && item.groupId === groupId
  );

  if (geofenceIndex === -1) {
    return next(
      new AppError("No geofence entry found with the provided IDs", 404)
    );
  }

  // Remove the geofence entry
  user.geodata.splice(geofenceIndex, 1);

  // Save the updated user document
  // await user.save();
  await User.findByIdAndUpdate(
    user._id,
    { geodata: user.geodata },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    message: "geofence successfully removed",
    geoData: user.geodata.map((item) => {
      return {
        currentGeofenceId: item.currentGeofenceId,
        groupId: item.groupId,
        geofenceName: item.geofenceName,
        enteredAt: item.enteredAt,
      };
    }),
  });
});

// Export all functions
module.exports = {
  uploadUserPhoto,
  resizeUserPhoto,
  updateUser,
  deleteUser,
  getAllUsers,
  getUser,
  addGeofence,
  removeGeofence,
};
