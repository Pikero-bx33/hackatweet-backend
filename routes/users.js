var express = require("express");
var router = express.Router();
const userController = require("../controllers/userController");
// POST /user/signup
router.post("/signup", userController.signup);

// POST /user/signin
router.post("/signin", userController.signin);

module.exports = router;
