const User = require('../models/users');
const twitter = require('twitter-text');
// const Hashtag = require('../models/hashtags');

//  rechercher le User avec le token fourni
async function getUser(token) {

  const userDetails = await User.findOne({ token });
  
    if (userDetails ) {

        return {
            result: true,
            _id: userDetails._id, 
            username: userDetails.username,
            fullName: userDetails.fullName,
        };

    } else {

      return { 
        result: false, 
        error: 'User not found.' 
      };

    }

//   return {
//     result: true,
//     _id: '6942f83c63fb8d5cdf3c9a1b', // after importing users.json in users collection, pending routes /users
//     username: 'cowboz',
//     fullName: 'john doe',
//   };
  // return {
  //     result: false, // if do not exists
  // };
}

function checkBody(body, keys) {
  let isValid = true;

  for (const field of keys) {
    if (!body[field] || body[field] === '') {
      isValid = false;
    }
  }

  return isValid;
}


module.exports = { checkBody, getUser };
