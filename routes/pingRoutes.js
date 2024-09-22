// pingRoutes.js
const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
    try {
        res.status(200).json({
            status: "success",
            message: "Ping successful!",
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            message: "Ping failed!",
        });
    }
});

module.exports = router;
