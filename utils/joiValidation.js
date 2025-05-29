const Joi = require("joi");

// URL params validation code

const createUuidValidationSchema = (fields) => {
  const schema = {};
  fields.forEach((field) => {
    schema[field] = Joi.string()
      .guid({ version: "uuidv4" })
      .required()
      .messages({
        "string.base": `${field} must be a string.`,
        "string.guid": `${field} must be a valid UUID.`,
        "any.required": `${field} is required in the params.`,
      });
  });
  return Joi.object(schema);
};

// Email validation code

module.exports.emailValidationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.base": "Email must be a string.",
    "string.email": "Please provide a valid email address.",
    "string.empty": "Email cannot be empty.",
    "any.required": "Email is required.",
  }),
});

// GeoFence related validation code

module.exports.geoFenceValidationSchema = Joi.object({
  currentGeofenceId: Joi.string()
    .guid({ version: "uuidv4" })
    .required()
    .messages({
      "string.base": "currentGeofenceId must be a string.",
      "string.guid": "currentGeofenceId must be a valid UUID.",
      "any.required": "currentGeofenceId is required.",
    }),
  groupId: Joi.string().guid({ version: "uuidv4" }).required().messages({
    "string.base": "groupId must be a string.",
    "string.guid": "groupId must be a valid UUID.",
    "any.required": "groupId is required.",
  }),
  geofenceName: Joi.string().min(1).max(50).required().messages({
    "string.base": "geofenceName must be a string.",
    "string.empty": "geofenceName cannot be empty.",
    "string.min": "geofenceName must have at least 1 character.",
    "string.max": "geofenceName must have at most 50 characters.",
    "any.required": "geofenceName is required.",
  }),
});

module.exports.IdParamsValidationSchema = createUuidValidationSchema(["id"]);
module.exports.GroupIdParamsValidationSchema = createUuidValidationSchema([
  "groupId",
]);
module.exports.GroupIdWithUserIdParamsValidationSchema =
  createUuidValidationSchema(["groupId", "userId"]);
module.exports.GroupIdWithFenceIdParamsValidationSchema =
  createUuidValidationSchema(["groupId", "fenceId"]);
