const express = require("express");
const { protect } = require("../controllers/authController");
const { getAllFences } = require("../controllers/fencesController");

const router = express.Router();

router.use(protect);

router.get("/", getAllFences);

module.exports = router;
