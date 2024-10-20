module.exports.userResponse = (user) => {
  return {
    uuid: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    relation: user.relation,
    avatar: user.avatar,
    location: {
      latitude: user.location.latitude,
      longitude: user.location.longitude,
      address: user.location.address,
      timestamp: user.location.timestamp,
    },
    status: {
      location_sharing: user.status.location_sharing,
      isMoving: user.status.isMoving,
      speed: user.status.speed,
      device: {
        screen: user.status.device.screen,
        wifi: user.status.device.wifi,
        battery_level: user.status.device.battery_level,
        charging: user.status.device.charging,
        currentApp: user.status.device.currentApp,
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
