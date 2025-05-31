const express = require("express");

const { protect } = require("../controllers/authController");
const { isSuperUserOnly } = require("../middleware/isSuperUserOnly");
const {
  updateLocationWithStatus,
} = require("./../controllers/locationWithstatusController");

// Mounting multiple router
const router = express.Router();

//Protect All routes after this middleware
router.use(protect);
router.use(isSuperUserOnly);

router.patch("/:id", updateLocationWithStatus); // superuser with all validation done

module.exports = router;
