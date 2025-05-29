const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Joi = require("joi");

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

// Request data validation using joi

module.exports.invitePostValidationSchema = Joi.object({
  _id: Joi.string().default(() => uuidv4()),

  invite_code: Joi.string().required().messages({
    "string.base": "Invite code must be a string.",
    "string.empty": "Invite code cannot be empty.",
    "any.required": "Invite code is required.",
  }),

  group_id: Joi.string().required().messages({
    "string.base": "Group ID must be a string.",
    "string.empty": "Group ID cannot be empty.",
    "any.required": "Group ID is required.",
  }),

  expires_in: Joi.date().optional().messages({
    "date.base": "Expires in must be a valid date.",
  }),

  created_at: Joi.date().optional().messages({
    "date.base": "Created at must be a valid date.",
  }),
})
  .required()
  .messages({
    "any.required": "Required information is missing.",
  });
module.exports.invitePatchValidationSchema = Joi.object({
  _id: Joi.string()
    .default(() => uuidv4())
    .optional()
    .messages({
      "string.base": "ID must be a string.",
    }),

  invite_code: Joi.string().optional().messages({
    "string.base": "Invite code must be a string.",
    "string.empty": "Invite code cannot be empty.",
  }),

  group_id: Joi.string().optional().messages({
    "string.base": "Group ID must be a string.",
    "string.empty": "Group ID cannot be empty.",
  }),

  expires_in: Joi.date().optional().messages({
    "date.base": "Expires in must be a valid date.",
  }),

  created_at: Joi.date().optional().messages({
    "date.base": "Created at must be a valid date.",
  }),
}).messages({
  "any.required": "Required information is missing.",
});

module.exports.Invite = mongoose.model("Invite", inviteSchema);
