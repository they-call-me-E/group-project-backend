const express = require("express");

const { protect } = require("../controllers/authController");
const {
  createFences,
  updateFences,
  deleteFences,
} = require("./../controllers/fencesController");

// Mounting multiple routers
const router = express.Router();

//Protect All routes after this middleware
router.use(protect);

router.post("/:id/fences/create", createFences); // all validation done
router.patch("/:groupId/fences/:fenceId/update", updateFences); // all validation done
router.delete("/:groupId/fences/:fenceId/delete", deleteFences); // all validation done

module.exports = router;
