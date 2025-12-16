const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        // lowercase: true, // allow JohnCena like in the video, unicity should be checked in express route
        trim: true,
    },
    fullName:  {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/.+@.+\..+/, "Please provide a valid email"],
    },
    password: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    token: {
        type: String,
        required: true,
    },
});

const User = mongoose.model('users', userSchema);

module.exports = User;