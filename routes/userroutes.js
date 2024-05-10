const express = require("express");

const { signup, signin, protect } = require("../controllers/authController");
const {
  updateUser,
  deleteUser,
  getUser,
  getAllUsers,
  uploadUserPhoto,
  resizeUserPhoto,
} = require("./../controllers/userController");

// Mounting multiple router
const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);

//Protect All routes after this middleware
router.use(protect);

router.patch("/:id", uploadUserPhoto, resizeUserPhoto, updateUser);
router.delete("/:id", deleteUser);
router.get("/", getAllUsers);
router.route("/:id").get(getUser);

module.exports = router;
