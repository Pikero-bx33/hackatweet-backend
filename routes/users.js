var express = require('express');
var router = express.Router();

const bcrypt = require("bcrypt");
const uid2 = require("uid2");
const { checkBody } = require('../modules/common');
const User = require('../models/users');

router.post('/signup', (req, res) => {

  const { username, fullName, password } = req.body;

  if (!checkBody(req.body, ['username', 'fullName', 'password'])) {
      res.json({
          result: false,
          error: 'Missing or empty fields.'
      });
      return;
  }

  // From morning-news-part5 + adjust:
  // Check if the user has not already been registered
  User.findOne({ username: new RegExp(`^${username}$`, 'i')}).then(data => {
    if (data === null) {

      const newUser = new User({
        username: username,
        fullName: fullName,
        password: bcrypt.hashSync(password, 10),
        token: uid2(32),
      });

      newUser.save().then(newDoc => {
        res.json({ 
          result: true, 
          userId: {
              username: newDoc.username,
              fullName: newDoc.fullName,
              token: newDoc.token,
            },
          });
      });
    } else {
      // User already exists in database
      res.json({ result: false, error: 'User already exists.' });
    }
  });
  // output ok: { result: true, username, fullName, token }

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
