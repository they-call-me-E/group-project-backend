const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please tell us a group name!"],
      minlength: 1,
      maxlength: 50,
    },
    ownerID: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    groupAdmin: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    members: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    inviteMembersList: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Group",
        required: true,
      },
    ],
    // fences: [
    //   {
    //     type: mongoose.Schema.ObjectId,
    //     ref: "Fences",
    //     unique: true,
    //   },
    // ],
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
  // this.populate({
  //   path: "fences",
  //   select: "-__v",
  // });
  this.populate({
    path: "ownerID",
    select: "-__v -password",
  });
  next();
});

module.exports.Group = mongoose.model("Group", groupSchema);
