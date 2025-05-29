const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const Joi = require("joi");

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
      movingStatus: {
        type: String,
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
    superuser: {
      type: Boolean,
      default: false,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    sessions: {
      mobile: { type: String, default: null },
    },
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiry: { type: Date },
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

// Request data validation using joi
module.exports.userPostValidationSchema = Joi.object({
  _id: Joi.string().default(() => uuidv4()),
  name: Joi.string().min(1).max(50).required().messages({
    "string.base": "Name must be a string.",
    "string.empty": "Name cannot be empty.",
    "string.min": "Name must have at least 1 character.",
    "string.max": "Name can have a maximum of 50 characters.",
    "any.required": "Name is required.",
  }),
  email: Joi.string().email().lowercase().required().messages({
    "string.email": "Please provide a valid email address.",
    "any.required": "Email is required.",
  }),
  inviteGroupsList: Joi.array()
    .items(
      Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required()
    )
    .messages({
      "array.base": "Invite groups must be an array.",
      "string.pattern.base": "Each group ID must be a valid ObjectId.",
    }),
  phone: Joi.string().optional(),
  relation: Joi.string().optional(),
  avatar: Joi.string().optional(),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password must be at least 8 characters long.",
    "any.required": "Password is required.",
  }),
  passwordConfirm: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords must match.",
    "any.required": "Password confirmation is required.",
  }),
  location: Joi.object({
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    address: Joi.string().optional(),
    timestamp: Joi.string().optional(),
  }).optional(),
  sessions: Joi.object({
    mobile: Joi.string().allow(null).optional(),
  }).optional(),
  status: Joi.object({
    location_sharing: Joi.boolean().optional(),
    isMoving: Joi.boolean().optional(),
    movingStatus: Joi.string().optional(),
    speed: Joi.number().optional(),
    device: Joi.object({
      screen: Joi.boolean().optional(),
      wifi: Joi.boolean().optional(),
      battery_level: Joi.number().optional(),
      charging: Joi.boolean().optional(),
      currentApp: Joi.string().optional(),
    }).optional(),
  }).optional(),
  geodata: Joi.array()
    .items(
      Joi.object({
        _id: Joi.string().default(() => uuidv4()),
        currentGeofenceId: Joi.string().required().messages({
          "any.required": "Current geofence ID is required.",
        }),
        groupId: Joi.string().required().messages({
          "any.required": "Group ID is required.",
        }),
        geofenceName: Joi.string().required().messages({
          "any.required": "Geofence name is required.",
        }),
        enteredAt: Joi.date().allow(null),
      })
    )
    .optional(),
  superuser: Joi.boolean().default(false),
  passwordResetToken: Joi.string().optional(),
  passwordResetExpires: Joi.date().optional(),
  isVerified: Joi.boolean().optional(),
  otp: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .optional()
    .messages({
      "string.base": "OTP must be a string.",
      "string.length": "OTP must be exactly 6 digits.",
      "string.pattern.base": "OTP must contain only numbers.",
      "any.required": "OTP is required.",
    }),

  otpExpiry: Joi.date().greater("now").optional().messages({
    "date.base": "OTP expiry must be a valid date.",
    "date.greater": "OTP expiry must be a future date.",
    "any.required": "OTP expiry date is required.",
  }),
})
  .required()
  .messages({
    "any.required": "Required information is missing.",
  });

module.exports.userPatchValidationSchema = Joi.object({
  _id: Joi.string()
    .default(() => uuidv4())
    .optional(),

  name: Joi.string().min(1).max(50).optional().messages({
    "string.base": "Name must be a string.",
    "string.empty": "Name cannot be empty.",
    "string.min": "Name must have at least 1 character.",
    "string.max": "Name can have a maximum of 50 characters.",
  }),

  email: Joi.string().email().lowercase().optional().messages({
    "string.email": "Please provide a valid email address.",
  }),

  inviteGroupsList: Joi.array()
    .items(
      Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional()
    )
    .optional()
    .messages({
      "array.base": "Invite groups must be an array.",
      "string.pattern.base": "Each group ID must be a valid ObjectId.",
    }),

  phone: Joi.string().optional(),
  relation: Joi.string().optional(),
  avatar: Joi.string().optional(),

  password: Joi.string().min(8).optional().messages({
    "string.min": "Password must be at least 8 characters long.",
  }),

  passwordConfirm: Joi.string().valid(Joi.ref("password")).optional().messages({
    "any.only": "Passwords must match.",
  }),

  location: Joi.object({
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    address: Joi.string().optional(),
    timestamp: Joi.string().optional(),
  }).optional(),
  sessions: Joi.object({
    mobile: Joi.string().allow(null).optional(),
  }).optional(),
  status: Joi.object({
    location_sharing: Joi.boolean().optional(),
    isMoving: Joi.boolean().optional(),
    movingStatus: Joi.string().optional(),
    speed: Joi.number().optional(),
    device: Joi.object({
      screen: Joi.boolean().optional(),
      wifi: Joi.boolean().optional(),
      battery_level: Joi.number().optional(),
      charging: Joi.boolean().optional(),
      currentApp: Joi.string().optional(),
    }).optional(),
  }).optional(),

  geodata: Joi.array()
    .items(
      Joi.object({
        _id: Joi.string()
          .default(() => uuidv4())
          .optional(),
        currentGeofenceId: Joi.string().optional().messages({
          "any.required": "Current geofence ID is required.",
        }),
        groupId: Joi.string().optional().messages({
          "any.required": "Group ID is required.",
        }),
        geofenceName: Joi.string().optional().messages({
          "any.required": "Geofence name is required.",
        }),
        enteredAt: Joi.date().allow(null).optional(),
      })
    )
    .optional(),

  superuser: Joi.boolean().optional(),
  passwordResetToken: Joi.string().optional(),
  passwordResetExpires: Joi.date().optional(),
  isVerified: Joi.boolean().optional(),
  otp: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .optional()
    .messages({
      "string.base": "OTP must be a string.",
      "string.length": "OTP must be exactly 6 digits.",
      "string.pattern.base": "OTP must contain only numbers.",
      "any.required": "OTP is required.",
    }),

  otpExpiry: Joi.date().greater("now").optional().messages({
    "date.base": "OTP expiry must be a valid date.",
    "date.greater": "OTP expiry must be a future date.",
    "any.required": "OTP expiry date is required.",
  }),
})
  .optional()
  .messages({
    "any.required": "Required information is missing.",
  });

module.exports.User = mongoose.model("User", userSchema);
