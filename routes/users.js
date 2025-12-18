var express = require('express');
var router = express.Router();

const bcrypt = require("bcrypt");
const uid2 = require("uid2");
const { checkBody } = require('../modules/common');
const Post = require('../models/users');

router.post('/signup', (req, res) => {

  const { username, fullName, password } = req.body;

  if (!checkBody(req.body, ['username', 'fullName', 'password'])) {
      res.json({
          result: false,
          error: 'Missing or empty fields.'
      });
      return;
  }

  // output ok: { result: true, username, fullName, token }
  // output err: { result: false, error: "Username not available." }

  res.send({result: true});

});

router.post('/signin', (req, res) => {

  const { username, password } = req.body;

    if (!checkBody(req.body, ['username', 'password'])) {
      res.json({
          result: false,
          error: 'Missing or empty fields.'
      });
      return;
  }
//
  // output ok: { result: true, username, fullName, token }
  // output err: { result: false, error: "Wrong username or password." }

  res.send({result: true});
});

module.exports = router;
