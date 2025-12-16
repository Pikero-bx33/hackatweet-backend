const mongoose = require('mongoose');

const postHashtagSchema = mongoose.Schema({
    // Clé de la relation post
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    // Clé de la relation hashtags
    hashtagId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hashtag',
        required: true,
    }
});

postHashtagSchema.index({ postId: 1, hashtagId: 1 }, { unique: true });

const PostHashtag = mongoose.model('PostHashtag', postHashtagSchema);

module.exports = PostHashtag;