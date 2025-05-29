const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const Joi = require("joi");

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

// Request data validation using joi

module.exports.avatarPostValidationSchema = Joi.object({
  _id: Joi.string().default(() => uuidv4()),

  avatar: Joi.string().required().messages({
    "string.base": "Avatar must be a string.",
    "string.empty": "Avatar cannot be empty.",
    "any.required": "Avatar is required.",
  }),

  ownerID: Joi.string().required().messages({
    "string.base": "Owner ID must be a string.",
    "string.empty": "Owner ID cannot be empty.",
    "any.required": "Owner ID is required.",
  }),
})
  .required()
  .messages({
    "any.required": "Required fields are missing.",
  });

module.exports.avatarPatchValidationSchema = Joi.object({
  _id: Joi.string()
    .default(() => uuidv4())
    .optional(),

  avatar: Joi.string().optional().messages({
    "string.base": "Avatar must be a string.",
    "string.empty": "Avatar cannot be empty.",
  }),

  ownerID: Joi.string().optional().messages({
    "string.base": "Owner ID must be a string.",
    "string.empty": "Owner ID cannot be empty.",
  }),
})
  .optional()
  .messages({
    "any.required": "Required fields are missing.",
  });

module.exports.Avatar = mongoose.model("Avatar", avatarSchema);
