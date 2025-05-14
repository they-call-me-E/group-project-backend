const express = require("express");
const { protect } = require("../controllers/authController");
const { getCollectionStats } = require("../controllers/statsController");

const statsRouter = express.Router();

// Protect the route
statsRouter.use(protect);

// Endpoint to get total counts of Users, Groups, and Fences
statsRouter.get("/data", getCollectionStats);

module.exports = statsRouter;
