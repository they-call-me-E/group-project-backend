const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

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

module.exports.Fences = mongoose.model("Fences", fencesSchema);
