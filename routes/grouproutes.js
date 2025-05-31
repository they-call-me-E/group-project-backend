const express = require("express");

const { protect } = require("../controllers/authController");
const { isSuperUserOnly } = require("../middleware/isSuperUserOnly");
const {
  createGroup,
  getAllgroups,
  getSingleGroup,
  addMembers,
  deleteGroup,
  getAllMembers,
  getAllGroupDataWithMembers,
  addAdmin,
  removeAdmin,
  removeMembers,
  leaveMembers,
  updateGroup,
  getAllAdmins,
} = require("./../controllers/groupController");
// const {
//   sendInviteMessage,
//   deleteInviteMessage,
// } = require("./../controllers/inviteGroupController");
const {
  getGroupFences,
  getSingleGroupFences,
} = require("./../controllers/fencesController");
const {
  generateInviteCode,
  joinGroupWithInvite,
} = require("./../controllers/inviteGroupController");

// Mounting multiple router
const router = express.Router();

//Protect All routes after this middleware
router.use(protect);
router.use(isSuperUserOnly);

router.get("/:groupId/members/:userId", getAllGroupDataWithMembers); // superuser with validation feature done
router.get("/:id/members", getAllMembers); // superuser with validation feature done
router.get("/:id/admins", getAllAdmins); // superuser with validation feature done
router.get("/", getAllgroups); // superuser with validation feature done
router.get("/:id", getSingleGroup); // superuser with validation feature done
router.post("/create", createGroup); // superuser with all validation feature done
router.patch("/:id/add/members", addMembers); //superuser with all validation feature done
router.patch("/:id/add/admin", addAdmin); // superuser with all validation feature done
router.patch("/:id/remove/admin", removeAdmin); // superuser with all validation feature done
router.patch("/:id/remove/members", removeMembers); // superuser with all validation feature done
router.delete("/:id", deleteGroup); // superuser with all validation feature done
router.patch("/:id", updateGroup); // superuser superuser all validation feature done
router.patch("/leave/:id", leaveMembers); //  superuser with and all validation feature done
router.get("/:id/fences", getGroupFences); // superuser with validation feature done
router.get("/:groupId/fences/:fenceId", getSingleGroupFences); // superuser with validation feature done
router.post("/:groupId/invite/generate", generateInviteCode); // I think Here is no need to implement superuser feature all validation feature done
router.post("/invite/join", joinGroupWithInvite); //I think Here is no need to implement superuser feature all validation feature done

module.exports = router;
