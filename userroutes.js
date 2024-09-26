const express = require("express");

const { signup, signin, protect } = require("../controllers/authController");
const {
  addGeofence,
  removeGeofence,
  updateUser,
  deleteUser,
  getUser,
  getAllUsers,
  uploadUserPhoto,
  resizeUserPhoto
} = require("../controllers/userController");

// Mounting multiple router
const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);

//Protect All routes after this middleware
router.use(protect);

// Geofence routes
router.post("/:id/geodata", addGeofence);  // Add geofence entry
router.delete("/:id/geodata", removeGeofence);  // Remove geofence entry

router.patch("/:id", uploadUserPhoto, resizeUserPhoto, updateUser);
router.delete("/:id", deleteUser);
router.get("/", getAllUsers);
router.route("/:id").get(getUser);

module.exports = router;
