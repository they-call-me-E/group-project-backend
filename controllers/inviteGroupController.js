const catchasync = require("../utils/catchasync");
const AppError = require("../utils/apperror");
const { Group } = require("../models/group");
const { Invite } = require("./../models/invite");
const { User } = require("../models/user");
const crypto = require("crypto");

module.exports.generateInviteCode = catchasync(async (req, res, next) => {
  const existing_group = await Group.findById(req.params.groupId);
  if (!existing_group) {
    return next(new AppError("No Document found with that GroupId", 404));
  }
  const existing_user = await User.findById(req.body.userId);
  if (!existing_user) {
    return next(new AppError("No Document found with that userId", 404));
  }

  const checkUser = existing_group.members.find((item) => {
    return req.user._id == JSON.stringify(item._id).replace(/"/g, "");
  });

  if (!checkUser) {
    return next(new AppError("You do not have permission this action", 403));
  }
  if (checkUser) {
    if (
      JSON.stringify(existing_group.ownerID._id).replace(/"/g, "") ===
      req.body.userId
    ) {
      return next(new AppError("I can't invite myself", 400));
    }
    // check existing invitation
    const find_user = await Invite.findOne({
      group_id: req.params.groupId,
      user_id: req.body.userId,
    });

    if (find_user) {
      if (new Date() < find_user.expires_in) {
        return next(
          new AppError("This user already received an invitation link", 409)
        );
      } else {
        // Code expired, remove it from the database
        await Invite.deleteOne({
          group_id: req.params.groupId,
          user_id: req.body.userId,
        });
      }
    }
    // Generate random invite code
    const inviteCode = crypto.randomBytes(3).toString("hex").toUpperCase();
    const document = await Invite.create({
      invite_code: inviteCode,
      created_at: Date.now(),
      group_id: req.params.groupId,
      user_id: req.body.userId,
    });

    res.status(201).json({
      document: {
        user_id: document?.user_id,
        group_id: document?.group_id,
        expires_in: document?.expires_in,
        invite_code: document?.invite_code,
      },
    });
  }
});

module.exports.joinGroupWithInvite = catchasync(async (req, res, next) => {
  const { invite_code, groupId } = req.body;
  const user = await Invite.findOne({
    user_id: req.user._id,
    group_id: groupId,
  });
  if (!user) {
    return next(
      new AppError(
        "Invalid invite code. Please check the code and try again.",
        400
      )
    );
  }
  if (user) {
    if (new Date() > user.expires_in) {
      // Code expired, remove it from the database
      await Invite.deleteOne({
        group_id: groupId,
        user_id: req.user._id,
      });
      return next(new AppError("Invite code expired", 400));
    }
    if (user.invite_code !== invite_code) {
      return next(
        new AppError(
          "Invalid invite code. Please check the code and try again.",
          400
        )
      );
    }
  }

  // update group member

  const existing_group = await Group.findById(groupId);
  if (!existing_group) {
    return next(
      new AppError("Oops! We couldn’t find any details for the group", 404)
    );
  }
  const find_user = existing_group.members.find((item) => {
    return JSON.stringify(item._id).replace(/"/g, "") == req.user._id;
  });
  if (find_user) {
    return next(
      new AppError("User already exists in the list of members", 409)
    );
  }

  const arr = existing_group.members.map((item) => {
    let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");

    return stringWithoutQuotes;
  });
  arr.push(JSON.stringify(req.user._id).replace(/"/g, ""));

  const body = {
    members: arr,
  };

  const data = await Group.findByIdAndUpdate(groupId, body, {
    new: true,
    runValidators: true,
  });
  // Code expired, remove it from the database
  await Invite.deleteOne({
    group_id: groupId,
    user_id: req.user._id,
  });

  res.status(200).json({ message: "You've successfully joined the group" });
});
