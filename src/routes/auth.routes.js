const express = require("express");
const authocontroller = require("../controllers/auth.controller");
const router = express.Router();

router.post("/login", authocontroller.login);


module.exports = router;