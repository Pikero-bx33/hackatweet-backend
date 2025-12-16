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
        _id: '17624587124587426',
        username: 'cowboz',
        fullName: 'john doe',
    };
    // return {
    //     result: false, // if do not exists
    // };
}


module.exports = { checkBody, getUser };
