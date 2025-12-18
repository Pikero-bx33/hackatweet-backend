const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    content: {
        type: String,
        required: true,
        maxlength: 280, 
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    type: {
        type: String,
        enum: ['TWEET', 'REPLY'], 
        default: 'TWEET',
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users', 
        required: true,
    },
    // likeCount: { // comes from counting how many likes (collection) are refering to this post
    //     type: Number,
    //     default: 0,
    // },
    hashtags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'hashtags',
    }],
    likesId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users', 
        required: true,
    },
});

const Post = mongoose.model('posts', postSchema);

module.exports = Post;