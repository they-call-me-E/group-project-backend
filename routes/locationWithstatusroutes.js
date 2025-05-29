const express = require("express");

const { protect } = require("../controllers/authController");
const {
  updateLocationWithStatus,
} = require("./../controllers/locationWithstatusController");

// Mounting multiple router
const router = express.Router();

//Protect All routes after this middleware
router.use(protect);

router.patch("/:id", updateLocationWithStatus); // all validation done

module.exports = router;
