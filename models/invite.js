const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const inviteSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    invite_code: {
      type: String,
      required: [true, "Please tell us an invite code!"],
    },
    // user_id: {
    //   type: mongoose.Schema.ObjectId,
    //   ref: "User",
    //   required: true,
    // },
    group_id: {
      type: String,
      ref: "Group",
      required: true,
    },
    expires_in: Date,
    created_at: Date,
  },
  { timestamps: true }
);

inviteSchema.pre("save", function (next) {
  if (this.created_at) {
    this.expires_in = new Date(Date.now() + 3 * 60 * 1000);
  }
  next();
});

module.exports.Invite = mongoose.model("Invite", inviteSchema);
