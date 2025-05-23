const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const { BUCKET_NAME, s3 } = require("./awsS3");

// getPresignedUrl ফাংশন
const getPresignedUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 86400 }); // 12 hours

    return presignedUrl;
  } catch (err) {
    console.log("err message");
    console.log(err);
    // throw new AppError("Failed to generate presigned URL", 500);
    return null;
  }
};

module.exports.userResponse = (user) => {
  return {
    uuid: user._id,
    name: user?.name,
    email: user?.email,
    phone: user?.phone,
    relation: user?.relation,
    avatar: user?.avatar,
    location: {
      latitude: user?.location?.latitude,
      longitude: user?.location?.longitude,
      address: user?.location?.address,
      timestamp: user?.location?.timestamp,
    },
    status: {
      location_sharing: user?.status?.location_sharing,
      isMoving: user?.status?.isMoving,
      movingStatus: user?.status?.movingStatus,
      speed: user?.status?.speed,
      device: {
        screen: user?.status?.device.screen,
        wifi: user?.status?.device?.wifi,
        battery_level: user?.status?.device?.battery_level,
        charging: user?.status?.device?.charging,
        currentApp: user?.status?.device?.currentApp,
      },
    },
    geoData: user?.geodata?.map((item) => {
      return {
        currentGeofenceId: item?.currentGeofenceId,
        groupId: item?.groupId,
        geofenceName: item?.geofenceName,
        enteredAt: item?.enteredAt,
      };
    }),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
const userResponseNew = (user) => {
  return {
    uuid: user._id,
    name: user?.name,
    email: user?.email,
    phone: user?.phone,
    relation: user?.relation,
    avatar: user?.avatar,
    location: {
      latitude: user?.location?.latitude,
      longitude: user?.location?.longitude,
      address: user?.location?.address,
      timestamp: user?.location?.timestamp,
    },
    status: {
      location_sharing: user?.status?.location_sharing,
      isMoving: user?.status?.isMoving,
      movingStatus: user?.status?.movingStatus,
      speed: user?.status?.speed,
      device: {
        screen: user?.status?.device.screen,
        wifi: user?.status?.device?.wifi,
        battery_level: user?.status?.device?.battery_level,
        charging: user?.status?.device?.charging,
        currentApp: user?.status?.device?.currentApp,
      },
    },
    geoData: user?.geodata?.map((item) => {
      return {
        currentGeofenceId: item?.currentGeofenceId,
        groupId: item?.groupId,
        geofenceName: item?.geofenceName,
        enteredAt: item?.enteredAt,
      };
    }),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

module.exports.userWithPresignedAvatarUrl = async (user, imageUrl) => {
  let avatarUrl;
  if (imageUrl) {
    user["avatar"] = imageUrl;
  } else if (user?.avatar) {
    avatarUrl = await getPresignedUrl(`users/${user.avatar}`);
  }
  if (avatarUrl) {
    user["avatar"] = avatarUrl;
  }

  return userResponseNew(user);
};
