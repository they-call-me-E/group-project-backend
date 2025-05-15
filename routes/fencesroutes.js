const express = require("express");

const { protect } = require("../controllers/authController");
const {
  createFences,
  updateFences,
  deleteFences,
} = require("./../controllers/fencesController");

// Mounting multiple router
const router = express.Router();

//Protect All routes after this middleware
router.use(protect);

router.post("/:id/fences/create", createFences);
router.patch("/:groupId/fences/:fenceId/update", updateFences);
router.delete("/:groupId/fences/:fenceId/delete", deleteFences);
router.get("/", getAllFences);

module.exports = router;
