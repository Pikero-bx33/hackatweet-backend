const User = require('../models/users');

function checkBody(body, keys) {
  let isValid = true;

  for (const field of keys) {
    if (!body[field] || body[field] === '') {
      isValid = false;
    }
  }

  return isValid;
}

// TODO rechercher le User avec le token fourni
function getUser( token ) {
    return { 
        result: true,
        _id: '6942f83c63fb8d5cdf3c9a1b', // after importing users.json in users collection, pending routes /users
        username: 'cowboz',
        fullName: 'john doe',
    };
    // return {
    //     result: false, // if do not exists
    // };
}


module.exports = { checkBody, getUser };
