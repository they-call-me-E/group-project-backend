const catchasync = require("../utils/catchasync");
const {
  Fences,
  fencesPostValidationSchema,
  fencesPatchValidationSchema,
} = require("../models/fences");
const { User } = require("../models/user");
const AppError = require("./../utils/apperror");
const { Group } = require("./../models/group");

const {
  IdParamsValidationSchema,
  GroupIdWithFenceIdParamsValidationSchema,
} = require("./../utils/joiValidation");

function isEmptyObjectCheck(obj) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) return false;
  }
  return true;
}
//create a fences
module.exports.createFences = catchasync(async function (req, res, next) {
  // Joi validation code start
  const { error: paramsError } = IdParamsValidationSchema.validate(req.params);

  if (paramsError) {
    return next(new AppError(paramsError.details[0].message, 400));
  }
  const { error: requestBodyError } = fencesPostValidationSchema.validate(
    req.body
  );

  if (requestBodyError) {
    return next(new AppError(requestBodyError.details[0].message, 400));
  }
  // Joi validation code end

  const existing_group = await Group.findById(req.params.id);
  if (!existing_group) {
    return next(new AppError("No group found with that GroupId", 404));
  }

  const admin_user = existing_group.groupAdmin.find((item) => {
    return (
      JSON.stringify(item._id).replace(/"/g, "") ==
      JSON.stringify(req.user._id).replace(/"/g, "")
    );
  });

  if (admin_user || req.superuser === true) {
    // create a fences
    const body = {
      ...req.body,
      groups: [req.params.id],
    };
    const data = await Fences.create(body);
    const document = {
      uuid: data._id,
      name: data.name,
      latitude: data.latitude,
      longitude: data.longitude,
      radius: data.radius,
      groups: data.groups,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    // socket code start
    const io = req.app.get("socketio");
    io.to(req.params.id).emit("createfences", {
      document,
    });

    res.status(201).json({
      document,
    });
  } else {
    return next(new AppError("You do not have permission this action", 403));
  }
});

// group fences array
module.exports.getGroupFences = catchasync(async function (req, res, next) {
  // Joi validation
  const { error } = IdParamsValidationSchema.validate(req.params);

  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  let filterFencesData = [];
  let groupMembersArr = [];
  const existing_group = await Group.findById(req.params.id);

  if (!existing_group) {
    return next(new AppError("No group found with that GroupId", 404));
  }
  const allFencesData = await Fences.find({});
  if (allFencesData?.length === 0) {
    return next(
      new AppError(
        "The requested data is not available because the database table is empty.",
        404
      )
    );
  }

  for (let i = 0; i < allFencesData?.length; i++) {
    for (let j = 0; j < allFencesData[i]?.groups?.length; j++) {
      if (
        JSON.stringify(allFencesData[i].groups[j]._id).replace(/"/g, "") ==
        JSON.stringify(req.params.id).replace(/"/g, "")
      ) {
        filterFencesData.push(allFencesData[i]);

        groupMembersArr = allFencesData[i].groups[j].members;
      }
    }
  }

  if (isEmptyObjectCheck(filterFencesData) && groupMembersArr?.length === 0) {
    return next(
      new AppError("No document associated with the provided Group Id", 404)
    );
  }

  const filterArr = filterFencesData.map((item) => {
    return {
      uuid: item._id,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      radius: item.radius,
      groupId: item.groups.map((item) => {
        return item.id;
      }),
    };
  });

  const singleItem = groupMembersArr.find((item) => {
    if (
      JSON.stringify(item._id).replace(/"/g, "") ==
      JSON.stringify(req.user._id).replace(/"/g, "")
    ) {
      return true;
    }
  });
  if (singleItem || req.superuser) {
    res.status(200).json({
      document: filterArr,
    });
  } else {
    return next(new AppError("Access Denied", 403));
  }
});

// group fences object

module.exports.getSingleGroupFences = catchasync(async function (
  req,
  res,
  next
) {
  // Joi validation code start
  const { error } = GroupIdWithFenceIdParamsValidationSchema.validate(
    req.params
  );

  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  // Joi validation code end

  let filterFencesData = {};
  let groupMembersArr = [];
  const allFencesData = await Fences.find({});

  if (allFencesData?.length === 0) {
    return next(
      new AppError(
        "The requested data is not available because the database table is empty.",
        404
      )
    );
  }

  const existing_group = await Group.findById(req.params.groupId);
  if (!existing_group) {
    return next(new AppError("No group found with that GroupId", 404));
  }
  const existing_fence = await Fences.findById(req.params.fenceId);
  if (!existing_fence) {
    return next(new AppError("No fence found with that FenceId", 404));
  }

  for (let i = 0; i < allFencesData?.length; i++) {
    for (let j = 0; j < allFencesData[i]?.groups?.length; j++) {
      if (
        JSON.stringify(allFencesData[i].groups[j]._id).replace(/"/g, "") ==
          JSON.stringify(req.params.groupId).replace(/"/g, "") &&
        JSON.stringify(allFencesData[i]._id).replace(/"/g, "") ==
          JSON.stringify(req.params.fenceId).replace(/"/g, "")
      ) {
        filterFencesData = allFencesData[i];
        groupMembersArr = allFencesData[i].groups[j].members;
      }
    }
  }

  if (isEmptyObjectCheck(filterFencesData) && groupMembersArr?.length === 0) {
    return next(
      new AppError(
        "No document associated with the provided Group Id and Fence Id",
        404
      )
    );
  }

  const document = {
    uuid: filterFencesData?._id,
    name: filterFencesData?.name,
    latitude: filterFencesData?.latitude,
    longitude: filterFencesData?.longitude,
    radius: filterFencesData?.radius,
    groupId: filterFencesData?.groups?.map((item) => {
      return item.id;
    }),
  };

  const singleItem = groupMembersArr.find((item) => {
    if (
      JSON.stringify(item._id).replace(/"/g, "") ==
      JSON.stringify(req.user._id).replace(/"/g, "")
    ) {
      return true;
    }
  });
  if (singleItem || req.superuser) {
    res.status(200).json({
      document,
    });
  } else {
    return next(new AppError("Access Denied", 403));
  }
});

// update fences functionality

module.exports.updateFences = catchasync(async (req, res, next) => {
  // Joi validation start
  const { error } = GroupIdWithFenceIdParamsValidationSchema.validate(
    req.params
  );

  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  const { error: requestBodyError } = fencesPatchValidationSchema.validate(
    req.body
  );

  if (requestBodyError) {
    return next(new AppError(requestBodyError.details[0].message, 400));
  }
  // Joi validation end

  const existing_fences = await Fences.findById(req.params.fenceId);
  if (!existing_fences) {
    return next(new AppError("No Document found with that Fence Id", 404));
  }

  const group_info = existing_fences.groups.find((item) => {
    return JSON.stringify(item._id).replace(/"/g, "") == req.params.groupId;
  });

  if (!group_info) {
    return next(new AppError("No Document found with that Group Id", 404));
  }
  const existing_group = await Group.findById(
    JSON.stringify(group_info._id).replace(/"/g, "")
  );

  const admin_user = existing_group.groupAdmin.find((item) => {
    return (
      JSON.stringify(item._id).replace(/"/g, "") ==
      JSON.stringify(req.user._id).replace(/"/g, "")
    );
  });

  if (admin_user || req.superuser === true) {
    const body = {
      ...req.body,
    };

    const data = await Fences.findByIdAndUpdate(req.params.fenceId, body, {
      new: true,
      runValidators: true,
    });

    const document = {
      uuid: data._id,
      name: data.name,
      latitude: data.latitude,
      longitude: data.longitude,
      radius: data.radius,
      groups: data.groups.map((item) => {
        return item._id;
      }),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    res.status(200).json({
      document,
    });
  } else {
    return next(new AppError("You do not have permission this action", 403));
  }
});

// delete fences functionality

module.exports.deleteFences = catchasync(async (req, res, next) => {
  // Joi validation
  const { error } = GroupIdWithFenceIdParamsValidationSchema.validate(
    req.params
  );

  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const existing_fences = await Fences.findById(req.params.fenceId);
  if (!existing_fences) {
    return next(new AppError("No Document found with that Fence Id", 404));
  }

  const group_info = existing_fences.groups.find((item) => {
    return JSON.stringify(item._id).replace(/"/g, "") == req.params.groupId;
  });

  if (!group_info) {
    return next(new AppError("No Document found with that Group Id", 404));
  }
  const existing_group = await Group.findById(
    JSON.stringify(group_info._id).replace(/"/g, "")
  );

  const admin_user = existing_group.groupAdmin.find((item) => {
    return (
      JSON.stringify(item._id).replace(/"/g, "") ==
      JSON.stringify(req.user._id).replace(/"/g, "")
    );
  });

  if (admin_user || req.superuser === true) {
    const fences = await Fences.findByIdAndDelete(req.params.fenceId);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } else {
    return next(new AppError("You do not have permission this action", 403));
  }
});

module.exports.getAllFences = catchasync(async function (req, res, next) {
  const fences = await Fences.find({});
  const result = fences.map((fence) => ({
    uuid: fence._id,
    name: fence.name,
    latitude: fence.latitude,
    longitude: fence.longitude,
    radius: fence.radius,
    groupCount: fence.groups.length,
    groups: fence.groups.map((group) => ({
      uuid: group._id,
      name: group.name,
      memberCount: group.members.length,
    })),
    createdAt: fence.createdAt,
    updatedAt: fence.updatedAt,
  }));

  res.status(200).json({
    fences: result,
  });
});
