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
    },
    longitude: {
      type: Number,
    },
    radius: {
      type: String,
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
