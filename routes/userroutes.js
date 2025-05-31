const express = require("express");
const { verifyEmail } = require("./../middleware/verifyEmail");
const { isSuperUserOnly } = require("../middleware/isSuperUserOnly");

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
const {
  signinLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} = require("./../utils/rateLimiters");

// Mounting multiple router
const router = express.Router();

router.post("/signup", signup); // all validation done
router.post("/signin", signinLimiter, signin); // all validation done
router.post("/forgotPassword", forgotPasswordLimiter, forgotPassword); // all validation done
router.patch("/resetPassword/:token", resetPasswordLimiter, resetPassword); // all validation done
router.post("/verify-email", verifyEmail); // all validation done

//Protect All routes after this middleware
router.use(protect);
router.use(isSuperUserOnly);

// Geofence routes

router.patch("/:id/geodata", addGeofence); // superuser with all validation done
router.delete("/:id/geodata", removeGeofence); // superuser with all validation done

router.patch("/:id", uploadUserPhoto, resizeUserPhoto, updateUser); // superuser with all validation done
router.delete("/:id", deleteUser); // superuser with all validation done
router.get("/", getAllUsers);
router.get("/:id", getUser); // all validation done

module.exports = router;
