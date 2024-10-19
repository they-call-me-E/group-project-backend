const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    name: {
      type: String,
      required: [true, "Please tell us your name!"],
      minlength: 1,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please Provide Your valid email"],
    },
    inviteGroupsList: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Group",
        required: true,
      },
    ],
    phone: {
      type: String,
    },
    relation: {
      type: String,
    },
    avatar: {
      type: String,
    },
    password: {
      type: String,
      required: [true, "Please Provide a password"],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, "Please Confirm your password"],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords are not the same",
      },
    },
    location: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
      address: {
        type: String,
      },
      timestamp: {
        type: String,
      },
    },
    status: {
      location_sharing: {
        type: Boolean,
      },
      isMoving: {
        type: Boolean,
      },
      speed: {
        type: Number,
      },
      device: {
        screen: {
          type: Boolean,
        },
        wifi: {
          type: Boolean,
        },
        battery_level: {
          type: Number,
        },
        charging: {
          type: Boolean,
        },
        currentApp: {
          type: String,
        },
      },
    },
    // Geodata for geofence tracking
    geodata: [
      {
        _id: {
          type: String,
          default: uuidv4,
        },
        currentGeofenceId: {
          type: String,
          required: true, // Geofence ID is required
          // my code (shakib)
          ref: "Fences",
        },
        groupId: {
          type: String,
          required: true, // Group ID is required
          ref: "Group",
        },
        geofenceName: {
          type: String,
          required: [true, "geofenceName is required"], // Geofence name is mandatory
        },
        enteredAt: {
          type: Date,
          default: null, // Set when the user enters a geofence
        },
      },
    ],
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  return next();
});
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  return next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  // False means Not changed
  return false;
};

userSchema.methods.creatPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 30 * 60 * 1000;
  return resetToken;
};

module.exports.User = mongoose.model("User", userSchema);
