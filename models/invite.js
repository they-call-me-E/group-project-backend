const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema(
  {
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
      type: mongoose.Schema.ObjectId,
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
