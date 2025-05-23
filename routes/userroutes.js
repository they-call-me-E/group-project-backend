const express = require("express");

const {
  signup,
  signin,
  protect,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const {
  addGeofence,
  removeGeofence,
  updateUser,
  deleteUser,
  getUser,
  getAllUsers,
  uploadUserPhoto,
  resizeUserPhoto,
} = require("../controllers/userController");

// Mounting multiple router
const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);

//Protect All routes after this middleware
router.use(protect);

// Geofence routes

router.patch("/:id/geodata", addGeofence); // Add geofence entry
router.delete("/:id/geodata", removeGeofence); // Remove geofence entry

router.patch("/:id", uploadUserPhoto, resizeUserPhoto, updateUser);
router.delete("/:id", deleteUser);
router.get("/", getAllUsers);
router.get("/:id", getUser);

module.exports = router;
