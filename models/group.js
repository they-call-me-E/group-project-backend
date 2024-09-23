const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const groupSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    name: {
      type: String,
      required: [true, "Please tell us a group name!"],
      minlength: 1,
      maxlength: 50,
    },
    ownerID: {
      type: String,
      ref: "User",
      required: true,
    },
    groupAdmin: [
      {
        type: String,
        ref: "User",
        required: true,
      },
    ],

    members: [
      {
        type: String,
        ref: "User",
        required: true,
      },
    ],
    inviteMembersList: [
      // {
      //   invite_code: {
      //     type: String,
      //     required: [true, "Please tell us an invite code!"],
      //   },
      //   user_id: {
      //     type: mongoose.Schema.ObjectId,
      //     ref: "User",
      //     required: true,
      //   },
      //   group_id: {
      //     type: mongoose.Schema.ObjectId,
      //     ref: "Group",
      //     required: true,
      //   },
      //   expires_in: Date,
      //   created_at: Date.now,
      // },
    ],
  },
  { timestamps: true }
);

groupSchema.pre(/^find/, function (next) {
  this.populate({
    path: "members",
    select: "-__v -password",
  });
  this.populate({
    path: "groupAdmin",
    select: "-__v -password",
  });

  this.populate({
    path: "ownerID",
    select: "-__v -password",
  });
  next();
});

module.exports.Group = mongoose.model("Group", groupSchema);
