const express = require("express");

const { protect } = require("../controllers/authController");
const { updateLocation } = require("./../controllers/locationController");

// Mounting multiple router
const router = express.Router();

//Protect All routes after this middleware
router.use(protect);

router.patch("/:id", updateLocation);

module.exports = router;
