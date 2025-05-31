const express = require("express");

const { protect } = require("../controllers/authController");
const {
  createFences,
  updateFences,
  deleteFences,
} = require("./../controllers/fencesController");
const { isSuperUserOnly } = require("../middleware/isSuperUserOnly");

// Mounting multiple routers
const router = express.Router();

//Protect All routes after this middleware
router.use(protect);
router.use(isSuperUserOnly);

router.post("/:id/fences/create", createFences); // superuser with all validation done
router.patch("/:groupId/fences/:fenceId/update", updateFences); // superuser with all validation done
router.delete("/:groupId/fences/:fenceId/delete", deleteFences); // superuser with all validation done

module.exports = router;
