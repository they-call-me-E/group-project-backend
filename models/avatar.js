const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const avatarSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    avatar: {
      type: String,
      required: true,
    },
    ownerID: {
      type: String,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports.Avatar = mongoose.model("Avatar", avatarSchema);
