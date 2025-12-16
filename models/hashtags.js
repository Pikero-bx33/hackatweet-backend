const mongoose = require('mongoose');

const hashtagSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    }
});

const Hashtag = mongoose.model('hashtags', hashtagSchema);

module.exports = Hashtag;