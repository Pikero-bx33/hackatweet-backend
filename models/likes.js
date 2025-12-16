const mongoose = require('mongoose');

const likeSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'posts',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

likeSchema.index({ userId: 1, postId: 1 }, { unique: true });

const Like = mongoose.model('likes', likeSchema);

module.exports = Like;