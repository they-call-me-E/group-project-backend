const catchasync = require("../utils/catchasync");
const { Group } = require("../models/group");
const { User } = require("../models/user");
const AppError = require("./../utils/apperror");
const { userWithPresignedAvatarUrl } = require("./../utils/userResponse");
const { Avatar } = require("./../models/avatar");

//create a group
module.exports.createGroup = catchasync(async function (req, res, next) {
  const body = {
    name: req.body.name,
    ownerID: req.user._id,
    members: [req.user._id],
    groupAdmin: [req.user._id],
  };
  const data = await Group.create(body);
  const document = {
    name: data.name,
    ownerID: data.ownerID,
    members: data.members,
    groupAdmin: data.groupAdmin,
    uuid: data._id,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
  res.status(201).json({
    document,
  });
});

// read all groups information

module.exports.getAllgroups = catchasync(async function (req, res, next) {
  // req.user._id === members[id]

  const data = await Group.find({});
  let newDataArr = [];
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[i].members.length; j++) {
      if (
        req.user._id == JSON.stringify(data[i].members[j]._id).replace(/"/g, "")
      ) {
        newDataArr.push(data[i]);
      }
    }
  }

  const document = newDataArr.map((item) => {
    return {
      uuid: item._id,
      name: item.name,
      createdAt: item.createdAt,
      memberCount: item.members.length,
    };
  });

  res.status(200).json({
    document,
  });
});
const handleAdminList = async (groupAdmin) => {
  const adminIds = groupAdmin.map((admin) => admin._id);

  const avatarInfos = await Avatar.find({ ownerID: { $in: adminIds } });

  const avatarMap = new Map();
  avatarInfos.forEach((avatar) => {
    avatarMap.set(avatar.ownerID.toString(), avatar.avatar);
  });

  const adminList = await Promise.all(
    groupAdmin.map(async (user) => {
      const avatarKey = avatarMap.get(user._id.toString());
      return await userWithPresignedAvatarUrl(user, avatarKey);
    })
  );

  return adminList;
};
const processMembers = async (members) => {
  const memberIds = members.map((member) => member._id);

  const avatarInfos = await Avatar.find({ ownerID: { $in: memberIds } });

  const avatarMap = new Map();
  avatarInfos.forEach((avatar) => {
    avatarMap.set(avatar.ownerID.toString(), avatar.avatar);
  });

  const processedMembers = await Promise.all(
    members.map(async (user) => {
      const avatarKey = avatarMap.get(user._id.toString());
      return await userWithPresignedAvatarUrl(user, avatarKey);
    })
  );

  return processedMembers;
};

// read single group information

module.exports.getSingleGroup = catchasync(async function (req, res, next) {
  const data = await Group.findById(req.params.id);

  // if (req.user._id !== JSON.stringify(data.ownerID).replace(/"/g, "")) {
  //   return next(new AppError("You are not member this group", 403));
  // }

  if (!data) {
    return next(new AppError("No Document found with that GroupId", 404));
  }
  const checkUser = data.members.find((item) => {
    return req.user._id == JSON.stringify(item._id).replace(/"/g, "");
  });

  if (!checkUser) {
    return next(new AppError("Access Denied", 403));
  }
  const document = {
    uuid: data._id,
    name: data.name,
    createdAt: data.createdAt,
    adminList: await handleAdminList(data.groupAdmin),

    // adminList: data.groupAdmin.map((item) => {
    //   return userResponse(item);
    // }),
    members: await processMembers(data.members),
    // members: data.members.map((item) => {
    //   return userResponse(item);
    // }),
  };
  res.status(200).json({
    document,
  });
});

// Gets full data associated with the member id

module.exports.getAllGroupDataWithMembers = catchasync(async function (
  req,
  res,
  next
) {
  const data = await Group.findById(req.params.groupId);
  if (!data) {
    return next(new AppError("No Document found with that Group Id", 404));
  }
  const checkUser = data.members.find((item) => {
    return (
      // JSON.stringify(req.user._id).replace(/"/g, "") ==
      //   JSON.stringify(item._id).replace(/"/g, "") &&
      JSON.stringify(req.params.userId).replace(/"/g, "") ==
      JSON.stringify(item._id).replace(/"/g, "")
    );
  });

  if (!checkUser) {
    return next(new AppError("Access Denied", 403));
  }

  const checkUser1 = data.members.find((item) => {
    return (
      JSON.stringify(req.user._id).replace(/"/g, "") ==
      JSON.stringify(item._id).replace(/"/g, "")
    );
  });

  if (!checkUser1) {
    return next(new AppError("Access Denied", 403));
  }

  const avatarInfo = await Avatar.findOne({ ownerID: data.ownerID });

  const document = {
    uuid: data._id,
    name: data.name,
    ownerID: await userWithPresignedAvatarUrl(data.ownerID, avatarInfo?.avatar),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    adminList: await handleAdminList(data.groupAdmin),
    // adminList: data.groupAdmin.map((item) => {
    //   return userResponse(item);
    // }),
    members: await processMembers(data.members),
    // members: data.members.map((item) => {
    //   return userResponse(item);
    // }),
  };
  res.status(200).json({
    document,
  });
});

// add members in groups

module.exports.addMembers = catchasync(async function (req, res, next) {
  const check_user = await User.findById(req.body.userId);
  if (!check_user) {
    return next(new AppError("No Document found with that userId", 404));
  }

  const existing_group = await Group.findById(req.params.id);

  if (!existing_group) {
    return next(new AppError("No Document found with that groupId", 404));
  }

  const admin_user = existing_group.groupAdmin.find((item) => {
    return (
      JSON.stringify(item._id).replace(/"/g, "") ==
      JSON.stringify(req.user._id).replace(/"/g, "")
    );
  });

  if (admin_user) {
    const find_user = existing_group.members.find((item) => {
      return JSON.stringify(item._id).replace(/"/g, "") == req.body.userId;
    });
    if (find_user) {
      return next(
        new AppError("User already exists in the list of members", 409)
      );
    }

    const find_admin = existing_group.groupAdmin.find((item) => {
      return (
        JSON.stringify(item._id).replace(/"/g, "") ==
        JSON.stringify(req.user._id).replace(/"/g, "")
      );
    });
    // if (find_admin) {
    //   return next(
    //     new AppError(
    //       "User already admin for this group. No action needed.",
    //       409
    //     )
    //   );
    // }

    const arr = existing_group.members.map((item) => {
      let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");

      return stringWithoutQuotes;
    });
    arr.push(req.body.userId);

    const body = {
      members: arr,
    };

    if (
      JSON.stringify(req.user._id).replace(/"/g, "") !==
      JSON.stringify(find_admin._id).replace(/"/g, "")
    ) {
      return next(new AppError("You do not have permission this action", 403));
    }
    const data = await Group.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    const avatarInfo = await Avatar.findOne({ ownerID: data.ownerID });

    const document = {
      uuid: data._id,
      name: data.name,
      ownerID: await userWithPresignedAvatarUrl(
        data.ownerID,
        avatarInfo?.avatar
      ),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      adminList: await handleAdminList(data.groupAdmin),
      // adminList: data.groupAdmin.map((item) => {
      //   return userResponse(item);
      // }),
      members: await processMembers(data.members),
      // members: data.members.map((item) => {
      //   return userResponse(item);
      // }),
    };

    res.status(200).json({
      document,
    });
  } else {
    return next(new AppError("You do not have permission this action", 403));
  }
});

// delete a group
module.exports.deleteGroup = catchasync(async function (req, res, next) {
  const existing_group = await Group.findById(req.params.id);
  if (!existing_group) {
    return next(new AppError("No Document found with that GroupId", 404));
  }

  const admin_user = existing_group.groupAdmin.find((item) => {
    return (
      JSON.stringify(item._id).replace(/"/g, "") ==
      JSON.stringify(req.user._id).replace(/"/g, "")
    );
  });
  if (admin_user) {
    const group = await Group.findByIdAndDelete(req.params.id);
    if (!group) {
      return next(new AppError("No Document found with that GroupId", 404));
    }
    res.status(204).json({
      status: "success",
      data: null,
    });
  } else {
    return next(new AppError("You do not have permission this action", 403));
  }
});

// Array of all members associated with group id

module.exports.getAllMembers = catchasync(async function (req, res, next) {
  const data = await Group.findById(req.params.id);

  if (!data) {
    return next(new AppError("No Document found with that GroupId", 404));
  }
  const checkUser = data.members.find((item) => {
    return req.user._id == JSON.stringify(item._id).replace(/"/g, "");
  });

  if (!checkUser) {
    return next(new AppError("Access Denied", 403));
  }

  // updated code start
  // const document = {
  //   members: data.members.map((member) => {
  //         data.groupAdmin.map((admin) =>{
  //              if(member._id === admin_id){

  //              }
  //         })
  //     return userResponse(item);
  //   }),
  // };
  // updated code end

  const document = {
    members: await processMembers(data.members),
    // members: data.members.map((item) => {
    //   return userResponse(item);
    // }),
    admins: await handleAdminList(data.groupAdmin),

    // admins: data.groupAdmin.map((item) => {
    //   return userResponse(item);
    // }),
  };

  document.members.forEach((member) => {
    const isAdmin = document.admins.some(
      (admin) => admin.uuid.toString() === member.uuid.toString()
    );
    member.is_admin = isAdmin;
  });

  res.status(200).json({
    document: {
      members: document.members,
    },
  });
});

// add admin in groups
module.exports.addAdmin = catchasync(async function (req, res, next) {
  const check_user = await User.findById(req.body.userId);
  if (!check_user) {
    return next(new AppError("No Document found with that userId", 404));
  }

  const existing_group = await Group.findById(req.params.id);

  if (!existing_group) {
    return next(new AppError("No Document found with that groupId", 404));
  }

  const admin_user = existing_group.groupAdmin.find((item) => {
    return (
      JSON.stringify(item._id).replace(/"/g, "") ==
      JSON.stringify(req.user._id).replace(/"/g, "")
    );
  });

  if (admin_user) {
    const find_admin = existing_group.groupAdmin.find((item) => {
      return JSON.stringify(item._id).replace(/"/g, "") == req.body.userId;
    });
    if (find_admin) {
      return next(
        new AppError("User already exists in the list of adminList", 409)
      );
    } else {
      const arr = existing_group.groupAdmin.map((item) => {
        let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");

        return stringWithoutQuotes;
      });
      arr.push(req.body.userId);

      const body = {
        groupAdmin: arr,
      };

      // add admin as a group member
      const find_member = existing_group.members.find((item) => {
        return JSON.stringify(item._id).replace(/"/g, "") === req.body.userId;
      });
      if (find_member) {
        // this user already exist as a member in this group
      } else {
        const arr = existing_group.members.map((item) => {
          let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");
          return stringWithoutQuotes;
        });
        arr.push(req.body.userId);
        body.members = arr;
      }

      // only admin can take action

      const admin_action = existing_group.groupAdmin.find((item) => {
        return (
          JSON.stringify(item._id).replace(/"/g, "") ==
          JSON.stringify(req.user._id).replace(/"/g, "")
        );
      });

      if (admin_action) {
        const data = await Group.findByIdAndUpdate(req.params.id, body, {
          new: true,
          runValidators: true,
        });

        const avatarInfo = await Avatar.findOne({ ownerID: data.ownerID });

        const document = {
          uuid: data._id,
          name: data.name,
          ownerID: await userWithPresignedAvatarUrl(
            data.ownerID,
            avatarInfo?.avatar
          ),
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          adminList: await handleAdminList(data.groupAdmin),
          // adminList: data.groupAdmin.map((item) => {
          //   return userResponse(item);
          // }),
          members: await processMembers(data.members),
          // members: data.members.map((item) => {
          //   return userResponse(item);
          // }),
        };

        res.status(200).json({
          document,
        });
      } else {
        return next(
          new AppError("You do not have permission this action", 403)
        );
      }
    }
  } else {
    return next(new AppError("You do not have permission this action", 403));
  }
});

// admin delete functionality

module.exports.removeAdmin = catchasync(async function (req, res, next) {
  const existing_group = await Group.findById(req.params.id);
  if (!existing_group) {
    return next(new AppError("No Document found with that GroupId", 404));
  }

  const admin_user = existing_group.groupAdmin.find((item) => {
    return (
      JSON.stringify(item._id).replace(/"/g, "") ==
      JSON.stringify(req.user._id).replace(/"/g, "")
    );
  });

  if (admin_user) {
    // check if admin want to delete a group owner

    if (
      JSON.stringify(existing_group.ownerID._id).replace(/"/g, "") ===
      req.body.adminId
    ) {
      return next(
        new AppError(
          "You do not have permission this action ( delete group owner )",
          403
        )
      );
    }
    // delete as a admin
    const arr = existing_group.groupAdmin.filter((item) => {
      if (JSON.stringify(item._id).replace(/"/g, "") !== req.body.adminId) {
        let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");
        return stringWithoutQuotes;
      }
    });

    const newArr = arr.map((item) => {
      let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");

      return stringWithoutQuotes;
    });

    // delete as a member

    // const arrMembers = existing_group.members.filter((item) => {
    //   if (JSON.stringify(item._id).replace(/"/g, "") !== req.body.adminId) {
    //     let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");
    //     return stringWithoutQuotes;
    //   }
    // });

    // const newArrMembers = arrMembers.map((item) => {
    //   let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");

    //   return stringWithoutQuotes;
    // });

    const body = {
      groupAdmin: newArr,
      // members: newArrMembers,
    };
    const data = await Group.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    const avatarInfo = await Avatar.findOne({ ownerID: data.ownerID });
    const document = {
      uuid: data._id,
      name: data.name,
      ownerID: await userWithPresignedAvatarUrl(
        data.ownerID,
        avatarInfo?.avatar
      ),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      adminList: await handleAdminList(data.groupAdmin),
      // adminList: data.groupAdmin.map((item) => {
      //   return userResponse(item);
      // }),
      members: await processMembers(data.members),
      // members: data.members.map((item) => {
      //   return userResponse(item);
      // }),
    };

    res.status(200).json({
      document,
    });
  } else {
    return next(new AppError("You do not have permission this action", 403));
  }
});

// member delete functionality

module.exports.removeMembers = catchasync(async function (req, res, next) {
  const existing_group = await Group.findById(req.params.id);

  if (!existing_group) {
    return next(new AppError("No Document found with that groupId", 404));
  }

  const check_existing_user = existing_group.members.find((item) => {
    return (
      JSON.stringify(item._id).replace(/"/g, "") ==
      JSON.stringify(req.body.userId).replace(/"/g, "")
    );
  });
  if (!check_existing_user) {
    return next(new AppError("User not found in this group.", 404));
  }

  const admin_user = existing_group.groupAdmin.find((item) => {
    return (
      JSON.stringify(item._id).replace(/"/g, "") ==
      JSON.stringify(req.user._id).replace(/"/g, "")
    );
  });

  if (admin_user) {
    // delete as a member
    const memberArr = existing_group.members.filter((item) => {
      if (JSON.stringify(item._id).replace(/"/g, "") !== req.body.userId) {
        let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");
        return stringWithoutQuotes;
      }
    });

    // delete as a admin
    const adminArr = existing_group.groupAdmin.filter((item) => {
      if (JSON.stringify(item._id).replace(/"/g, "") !== req.body.userId) {
        let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");
        return stringWithoutQuotes;
      }
    });

    const newMemberArr = memberArr.map((item) => {
      let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");

      return stringWithoutQuotes;
    });

    const newAdminArr = adminArr.map((item) => {
      let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");

      return stringWithoutQuotes;
    });

    const body = {
      members: newMemberArr,
      groupAdmin: newAdminArr,
    };
    const data = await Group.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    const avatarInfo = await Avatar.findOne({ ownerID: data.ownerID });
    const document = {
      uuid: data._id,
      name: data.name,
      ownerID: await userWithPresignedAvatarUrl(
        data.ownerID,
        avatarInfo?.avatar
      ),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      adminList: await handleAdminList(data.groupAdmin),
      // adminList: data.groupAdmin.map((item) => {
      //   return userResponse(item);
      // }),
      members: await processMembers(data.members),
      // members: data.members.map((item) => {
      //   return userResponse(item);
      // }),
    };

    res.status(200).json({
      document,
    });
  } else {
    return next(new AppError("You do not have permission this action", 403));
  }
});

// user leave functionality from a group

module.exports.leaveMembers = catchasync(async function (req, res, next) {
  const existing_group = await Group.findById(req.params.id);

  if (!existing_group) {
    return next(new AppError("No Document found with that groupId", 404));
  }

  const check_existing_user = existing_group.members.find((item) => {
    return (
      JSON.stringify(item._id).replace(/"/g, "") ==
      JSON.stringify(req.user._id).replace(/"/g, "")
    );
  });

  if (!check_existing_user) {
    return next(new AppError("Access Denied", 403));
  }

  const check_existing_admin = existing_group.groupAdmin.find((item) => {
    return (
      JSON.stringify(item._id).replace(/"/g, "") ==
      JSON.stringify(req.user._id).replace(/"/g, "")
    );
  });

  if (check_existing_admin && check_existing_user) {
    // admin
    const arrAdmin = existing_group.groupAdmin.filter((item) => {
      if (
        JSON.stringify(item._id).replace(/"/g, "") !==
        JSON.stringify(req.user._id).replace(/"/g, "")
      ) {
        let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");
        return stringWithoutQuotes;
      }
    });
    const newadminArr = arrAdmin.map((item) => {
      let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");

      return stringWithoutQuotes;
    });
    // members
    const arrMembers = existing_group.members.filter((item) => {
      if (
        JSON.stringify(item._id).replace(/"/g, "") !==
        JSON.stringify(req.user._id).replace(/"/g, "")
      ) {
        let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");
        return stringWithoutQuotes;
      }
    });

    const newmembersArr = arrMembers.map((item) => {
      let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");

      return stringWithoutQuotes;
    });

    const body = {
      members: newmembersArr,
      groupAdmin: newadminArr,
    };
    const data = await Group.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    const avatarInfo = await Avatar.findOne({ ownerID: data.ownerID });
    const document = {
      uuid: data._id,
      name: data.name,
      ownerID: await userWithPresignedAvatarUrl(
        data.ownerID,
        avatarInfo?.avatar
      ),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      adminList: await handleAdminList(data.groupAdmin),
      // adminList: data.groupAdmin.map((item) => {
      //   return userResponse(item);
      // }),
      members: await processMembers(data.members),
      // members: data.members.map((item) => {
      //   return userResponse(item);
      // }),
    };

    res.status(200).json({
      document,
    });
  } else if (check_existing_user) {
    const arr = existing_group.members.filter((item) => {
      if (
        JSON.stringify(item._id).replace(/"/g, "") !==
        JSON.stringify(req.user._id).replace(/"/g, "")
      ) {
        let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");
        return stringWithoutQuotes;
      }
    });

    const newArr = arr.map((item) => {
      let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");

      return stringWithoutQuotes;
    });

    const body = {
      members: newArr,
    };
    const data = await Group.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    const avatarInfo = await Avatar.findOne({ ownerID: data.ownerID });

    const document = {
      uuid: data._id,
      name: data.name,
      ownerID: await userWithPresignedAvatarUrl(
        data.ownerID,
        avatarInfo?.avatar
      ),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      adminList: await handleAdminList(data.groupAdmin),
      // adminList: data.groupAdmin.map((item) => {
      //   return userResponse(item);
      // }),
      members: await processMembers(data.members),
      // members: data.members.map((item) => {
      //   return userResponse(item);
      // }),
    };

    res.status(200).json({
      document,
    });
  } else {
    return next(new AppError("You do not have permission this action", 403));
  }
});

// update group functionality

module.exports.updateGroup = catchasync(async (req, res, next) => {
  const existing_group = await Group.findById(req.params.id);
  if (!existing_group) {
    return next(new AppError("No Document found with that GroupId", 404));
  }

  const admin_user = existing_group.groupAdmin.find((item) => {
    return (
      JSON.stringify(item._id).replace(/"/g, "") ==
      JSON.stringify(req.user._id).replace(/"/g, "")
    );
  });
  if (admin_user) {
    if (!req?.body?.name) {
      return next(new AppError("The name field is required", 400));
    }
    // const check_unique_name = await Group.findById(req.params.id);
    // if (check_unique_name.name === req.body.name) {
    //   return next(new AppError("Name is already exist", 409));
    // }
    const body = {
      name: req.body.name,
    };
    const data = await Group.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    const avatarInfo = await Avatar.findOne({ ownerID: data.ownerID });
    const document = {
      uuid: data._id,
      name: data.name,
      ownerID: await userWithPresignedAvatarUrl(
        data.ownerID,
        avatarInfo?.avatar
      ),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      adminList: await handleAdminList(data.groupAdmin),
      // adminList: data.groupAdmin.map((item) => {
      //   return userResponse(item);
      // }),
      members: await processMembers(data.members),
      // members: data.members.map((item) => {
      //   return userResponse(item);
      // }),
    };

    res.status(200).json({
      document,
    });
  } else {
    return next(new AppError("You do not have permission this action", 403));
  }
});

// Array of all adminList associated with group id

module.exports.getAllAdmins = catchasync(async function (req, res, next) {
  const data = await Group.findById(req.params.id);

  if (!data) {
    return next(new AppError("No Document found with that GroupId", 404));
  }
  const checkUser = data.groupAdmin.find((item) => {
    return req.user._id == JSON.stringify(item._id).replace(/"/g, "");
  });

  if (!checkUser) {
    return next(new AppError("Access Denied", 403));
  }

  const document = {
    adminList: await handleAdminList(data.groupAdmin),
    // adminList: data.groupAdmin.map((item) => {
    //   return userResponse(item);
    // }),
  };

  document.adminList.forEach((member) => {
    const isAdmin = document.adminList.some(
      (admin) => admin.uuid.toString() === member.uuid.toString()
    );
    member.is_admin = isAdmin;
  });

  res.status(200).json({
    document: {
      adminList: document.adminList,
    },
  });
});
