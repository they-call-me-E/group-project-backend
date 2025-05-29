const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Joi = require("joi");

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

module.exports.GroupPostValidationSchema = (group) => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(50).required().messages({
      "string.empty": "Please provide a group name!",
      "string.min": "Group name must be at least 1 character!",
      "string.max": "Group name must not exceed 50 characters!",
    }),
    ownerID: Joi.string().required().messages({
      "string.empty": "Owner ID is required!",
    }),
    groupAdmin: Joi.array()
      .items(Joi.string().required())
      .min(1)
      .required()
      .messages({
        "array.min": "There must be at least one group admin!",
      }),
    members: Joi.array()
      .items(Joi.string().required())
      .min(1)
      .required()
      .messages({
        "array.min": "There must be at least one member!",
      }),
    inviteMembersList: Joi.array().items(
      Joi.object({
        invite_code: Joi.string().required().messages({
          "string.empty": "Invite code is required!",
        }),
        user_id: Joi.string().required().messages({
          "string.empty": "User ID is required!",
        }),
        group_id: Joi.string().required().messages({
          "string.empty": "Group ID is required!",
        }),
        expires_in: Joi.date(),
        created_at: Joi.date(),
      })
    ),
  });

  return schema.validate(group);
};
module.exports.GroupPatchValidationSchema = (group) => {
  const schema = Joi.object({
    userId: Joi.string().guid({ version: "uuidv4" }).optional().messages({
      "string.base": `userId must be a string.`,
      "string.guid": `userId must be a valid UUID.`,
      "any.required": `userId is required in the params.`,
    }),
    adminId: Joi.string().guid({ version: "uuidv4" }).optional().messages({
      "string.base": `adminId must be a string.`,
      "string.guid": `adminId must be a valid UUID.`,
      "any.required": `adminId is required in the params.`,
    }),

    name: Joi.string().min(1).max(50).optional().messages({
      "string.empty": "Please provide a group name!",
      "string.min": "Group name must be at least 1 character!",
      "string.max": "Group name must not exceed 50 characters!",
    }),
    ownerID: Joi.string().optional().messages({
      "string.empty": "Owner ID is required!",
    }),
    groupAdmin: Joi.array()
      .items(Joi.string().required())
      .min(1)
      .optional()
      .messages({
        "array.min": "There must be at least one group admin!",
      }),
    members: Joi.array()
      .items(Joi.string().required())
      .min(1)
      .optional()
      .messages({
        "array.min": "There must be at least one member!",
      }),
    inviteMembersList: Joi.array()
      .items(
        Joi.object({
          invite_code: Joi.string().optional().messages({
            "string.empty": "Invite code is required!",
          }),
          user_id: Joi.string().optional().messages({
            "string.empty": "User ID is required!",
          }),
          group_id: Joi.string().optional().messages({
            "string.empty": "Group ID is required!",
          }),
          expires_in: Joi.date().optional(),
          created_at: Joi.date().optional(),
        })
      )
      .optional(),
  });

  return schema.validate(group);
};

module.exports.Group = mongoose.model("Group", groupSchema);
