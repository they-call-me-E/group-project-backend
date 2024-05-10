const express = require("express");

const { protect } = require("../controllers/authController");
const { updateStatus } = require("./../controllers/statusController");

// Mounting multiple router
const router = express.Router();

//Protect All routes after this middleware
router.use(protect);

router.patch("/:id", updateStatus);

module.exports = router;
