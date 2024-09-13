const catchasync = require("../utils/catchasync");
const { Group } = require("../models/group");
const { User } = require("../models/user");
const AppError = require("../utils/apperror");
const { userResponse } = require("../utils/userResponse");

// send invite message
module.exports.sendInviteMessage = catchasync(async (req, res, next) => {
  const existing_group = await Group.findById(req.params.groupId);
  if (!existing_group) {
    return next(new AppError("No Document found with that GroupId", 404));
  }
  const existing_user = await User.findById(req.body.userId);
  if (!existing_user) {
    return next(new AppError("No Document found with that UserId", 404));
  }

  const admin_user = existing_group.groupAdmin.find((item) => {
    return (
      JSON.stringify(item._id).replace(/"/g, "") ==
      JSON.stringify(req.user._id).replace(/"/g, "")
    );
  });

  if (admin_user) {
    // insert data in group table

    if (
      JSON.stringify(existing_group.ownerID._id).replace(/"/g, "") ===
      req.body.userId
    ) {
      return next(new AppError("I can't invite myself", 400));
    }
    const find_user = existing_group.inviteMembersList.find((item) => {
      return JSON.stringify(item._id).replace(/"/g, "") == req.body.userId;
    });

    if (find_user) {
      return next(
        new AppError(
          "User already exists in the list of inviteMembersList",
          409
        )
      );
    }

    const arr = existing_group.inviteMembersList.map((item) => {
      let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");

      return stringWithoutQuotes;
    });

    arr.push(req.body.userId);

    const body = {
      inviteMembersList: arr,
    };
    const group_document = await Group.findByIdAndUpdate(
      req.params.groupId,
      body,
      {
        new: true,
        runValidators: true,
      }
    );
    // insert data in user table

    if (group_document) {
      const find_user = existing_user.inviteGroupsList.find((item) => {
        return JSON.stringify(item._id).replace(/"/g, "") == req.body.userId;
      });
      if (find_user) {
        return next(
          new AppError(
            "User already exists in the list of inviteGroupsList",
            409
          )
        );
      }

      const arr = existing_user.inviteGroupsList.map((item) => {
        let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");

        return stringWithoutQuotes;
      });
      arr.push(req.params.groupId);

      const body = {
        inviteGroupsList: arr,
      };
      const user_document = await User.findByIdAndUpdate(
        req.body.userId,
        body,
        {
          new: true,
          runValidators: true,
        }
      );
      if (user_document) {
        res.status(200).json({
          group_document,
          user_document,
        });
      } else {
        // server error message and delete userId from group table inviteMembersList array
        const arr = existing_group.inviteGroupsList.filter((item) => {
          if (JSON.stringify(item._id).replace(/"/g, "") !== req.body.userId) {
            let stringWithoutQuotes = JSON.stringify(item._id).replace(
              /"/g,
              ""
            );
            return stringWithoutQuotes;
          }
        });

        const newArr = arr.map((item) => {
          let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");

          return stringWithoutQuotes;
        });
        const body = {
          inviteGroupsList: newArr,
        };
        const document = await Group.findByIdAndUpdate(
          req.params.groupId,
          body,
          {
            new: true,
            runValidators: true,
          }
        );

        res.status(200).json({
          document,
        });
      }
    } else {
      return next(new AppError("Internal server error", 500));
    }
  } else {
    return next(new AppError("You do not have permission this action", 403));
  }
});

// delete invite message
module.exports.deleteInviteMessage = catchasync(async (req, res, next) => {
  const existing_group = await Group.findById(req.params.groupId);
  if (!existing_group) {
    return next(new AppError("No Document found with that GroupId", 404));
  }
  const existing_user = await User.findById(req.body.userId);
  if (!existing_user) {
    return next(new AppError("No Document found with that UserId", 404));
  }

  const admin_user = existing_group.groupAdmin.find((item) => {
    return (
      JSON.stringify(item._id).replace(/"/g, "") ==
      JSON.stringify(req.user._id).replace(/"/g, "")
    );
  });

  if (admin_user) {
    // insert data in group table

    const find_user = existing_group.inviteMembersList.find((item) => {
      return JSON.stringify(item._id).replace(/"/g, "") == req.body.userId;
    });

    if (!find_user) {
      return next(
        new AppError(
          "No Document found with that UserId in the list of inviteMembersList",
          404
        )
      );
    }

    const arr = existing_group.inviteMembersList.filter((item) => {
      if (JSON.stringify(item._id).replace(/"/g, "") !== req.body.userId) {
        let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");
        return stringWithoutQuotes;
      }
    });

    const newArr = arr.map((item) => {
      let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");

      return stringWithoutQuotes;
    });

    const body = {
      inviteMembersList: newArr,
    };
    const group_document = await Group.findByIdAndUpdate(
      req.params.groupId,
      body,
      {
        new: true,
        runValidators: true,
      }
    );
    // insert data in user table

    if (group_document) {
      const find_group = existing_user.inviteGroupsList.find((item) => {
        return JSON.stringify(item._id).replace(/"/g, "") == req.params.groupId;
      });

      if (!find_group) {
        return next(
          new AppError(
            "No Document found with that GroupId in the list of inviteGroupsList",
            404
          )
        );
      }

      const arr = existing_user.inviteGroupsList.filter((item) => {
        if (JSON.stringify(item._id).replace(/"/g, "") !== req.params.groupId) {
          let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");
          return stringWithoutQuotes;
        }
      });

      const newArr = arr.map((item) => {
        let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");

        return stringWithoutQuotes;
      });

      const body = {
        inviteGroupsList: newArr,
      };
      const user_document = await User.findByIdAndUpdate(
        req.body.userId,
        body,
        {
          new: true,
          runValidators: true,
        }
      );
      if (user_document) {
        res.status(200).json({
          group_document,
          user_document,
        });
      } else {
        // server error message and delete userId from group table inviteMembersList array
        const arr = existing_group.inviteMembersList.filter((item) => {
          if (JSON.stringify(item._id).replace(/"/g, "") !== req.body.userId) {
            let stringWithoutQuotes = JSON.stringify(item._id).replace(
              /"/g,
              ""
            );
            return stringWithoutQuotes;
          }
        });

        const newArr = arr.map((item) => {
          let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");

          return stringWithoutQuotes;
        });

        // const arr = existing_group.inviteMembersList.map((item) => {
        //   let stringWithoutQuotes = JSON.stringify(item._id).replace(/"/g, "");

        //   return stringWithoutQuotes;
        // });

        // arr.push(req.body.userId);

        const body = {
          inviteMembersList: newArr,
        };
        const document = await Group.findByIdAndUpdate(
          req.params.groupId,
          body,
          {
            new: true,
            runValidators: true,
          }
        );

        res.status(200).json({
          document,
        });
      }
    } else {
      return next(new AppError("Internal server error", 500));
    }
  } else {
    return next(new AppError("You do not have permission this action", 403));
  }
});
