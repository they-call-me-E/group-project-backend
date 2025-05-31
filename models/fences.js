const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Joi = require("joi");

const fencesSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    name: {
      type: String,
      required: [true, "Please tell us a fences name!"],
      minlength: 1,
      maxlength: 50,
    },
    latitude: {
      type: Number,
      required: [true, "Latitude is required"],
      min: [-90, "Latitude must be between -90 and 90"],
      max: [90, "Latitude must be between -90 and 90"],
    },
    longitude: {
      type: Number,
      required: [true, "Longitude is required"],
      min: [-180, "Longitude must be between -180 and 180"],
      max: [180, "Longitude must be between -180 and 180"],
    },
    radius: {
      type: Number,
      required: [true, "Radius is required"],
    },
    groups: [
      {
        type: String,
        ref: "Group",
        required: true,
      },
    ],
  },
  { timestamps: true }
);

fencesSchema.pre(/^find/, function (next) {
  this.populate({
    path: "groups",
    select: "-__v",
  });
  next();
});

// Request data validation using joi

module.exports.fencesPostValidationSchema = Joi.object({
  _id: Joi.string().default(() => uuidv4()),

  name: Joi.string().min(1).max(50).required().messages({
    "string.base": "Fence name must be a string.",
    "string.empty": "Fence name cannot be empty.",
    "string.min": "Fence name must have at least 1 character.",
    "string.max": "Fence name must have at most 50 characters.",
    "any.required": "Fence name is required.",
  }),

  latitude: Joi.number().required().min(-90).max(90).messages({
    "number.base": "Latitude must be a number.",
    "number.min": "Latitude must be between -90 and 90.",
    "number.max": "Latitude must be between -90 and 90.",
    "any.required": "Latitude is required.",
  }),

  longitude: Joi.number().required().min(-180).max(180).messages({
    "number.base": "Longitude must be a number.",
    "number.min": "Longitude must be between -180 and 180.",
    "number.max": "Longitude must be between -180 and 180.",
    "any.required": "Longitude is required.",
  }),

  radius: Joi.number().required().messages({
    "number.base": "Radius must be a number.",
    "any.required": "Radius is required.",
  }),

  groups: Joi.array()
    .items(
      Joi.string().optional().messages({
        "string.base": "Group ID must be a string.",
        "string.empty": "Group ID cannot be empty.",
      })
    )
    .optional()
    .messages({
      "array.base": "Groups must be an array.",
    }),
})
  .required()
  .messages({
    "any.required": "Required fields are missing.",
  });

module.exports.fencesPatchValidationSchema = Joi.object({
  _id: Joi.string()
    .default(() => uuidv4())
    .optional(),

  name: Joi.string().min(1).max(50).optional().messages({
    "string.base": "Fence name must be a string.",
    "string.empty": "Fence name cannot be empty.",
    "string.min": "Fence name must have at least 1 character.",
    "string.max": "Fence name must have at most 50 characters.",
  }),

  latitude: Joi.number().min(-90).max(90).optional().messages({
    "number.base": "Latitude must be a number.",
    "number.min": "Latitude must be between -90 and 90.",
    "number.max": "Latitude must be between -90 and 90.",
  }),

  longitude: Joi.number().min(-180).max(180).optional().messages({
    "number.base": "Longitude must be a number.",
    "number.min": "Longitude must be between -180 and 180.",
    "number.max": "Longitude must be between -180 and 180.",
  }),

  radius: Joi.number().optional().messages({
    "number.base": "Radius must be a number.",
  }),

  groups: Joi.array()
    .items(
      Joi.string().optional().messages({
        "string.base": "Group ID must be a string.",
        "string.empty": "Group ID cannot be empty.",
      })
    )
    .optional()
    .messages({
      "array.base": "Groups must be an array.",
    }),
})
  .optional()
  .messages({
    "any.required": "Required fields are missing.",
  });

module.exports.Fences = mongoose.model("Fences", fencesSchema);
