const express = require("express");

const { protect } = require("../controllers/authController");
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
} = require("./../controllers/groupController");
const {
  sendInviteMessage,
  deleteInviteMessage,
} = require("./../controllers/inviteGroupController");
const {
  getGroupFences,
  getSingleGroupFences,
} = require("./../controllers/fencesController");

// Mounting multiple router
const router = express.Router();

//Protect All routes after this middleware
router.use(protect);
router.get("/:groupId/members/:userId", getAllGroupDataWithMembers);
router.get("/:id/members", getAllMembers);
router.get("/", getAllgroups);
router.get("/:id", getSingleGroup);
router.post("/create", createGroup);
router.patch("/:id/add/members", addMembers);
router.patch("/:id/add/admin", addAdmin);
router.patch("/:id/remove/admin", removeAdmin);
router.patch("/:id/remove/members", removeMembers);
router.delete("/:id", deleteGroup);
router.patch("/:id", updateGroup);
router.patch("/leave/:id", leaveMembers);
router.get("/:id/fences", getGroupFences);
router.get("/:groupId/fences/:fenceId", getSingleGroupFences);
router.patch("/:groupId/invite/members", sendInviteMessage);
router.patch("/:groupId/delete/invite/members", deleteInviteMessage);

module.exports = router;
