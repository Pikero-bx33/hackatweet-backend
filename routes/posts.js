var express = require('express');
var router = express.Router();

const { checkBody, getUser } = require('../modules/common');
const Post = require('../models/posts');

const POSTS_MAX_LENGTH = 280;

router.post('/', async (req, res, next) => {

    const { token, content } = req.body;

    if (!checkBody(req.body, ['token', 'content'])) {
        res.json({
            result: false,
            error: 'Missing or empty fields.'
        });
        return;
    }

    const userDetails = getUser(token);

    if (!userDetails.result) {
        res.json({
            result: false,
            error: 'Invalid token.'
        });
    }

    if (content.length > POSTS_MAX_LENGTH) {
        res.json({
            result: false,
            error: `Content too long. Max length is ${POSTS_MAX_LENGTH}.`
        });
        return;
    }

    //  hashtag processing required ...

    const newPost = await new Post({
        content: content,
        createdAt: new Date(),
        type: 'TWEET',
        userId: userDetails._id,
    });

    await newPost.save();

    res.json({
        result: true,
        postId: newPost._id,
        createdByFullName: userDetails.fullName,
        createdByUsername: userDetails.username,
        createdAt: newPost.createdAt,
        content: newPost.content,
        // hashTags[]
    });

});

// DELETE
router.delete('/', async (req, res) => {

    const { token, postId } = req.body;

    // Verif champs
    if (!checkBody(req.body, ['token', 'postId'])) {
        return res.json({
            result: false,
            error: 'Missing or empty fields.',
        });
    }

    // Verif token 
    const userDetails = getUser(token);

    if (!userDetails.result) {
        res.json({
            result: false,
            error: 'Invalid token.'
        });
    }

    // Verif post existe
    const post = await Post.finById(postId);

    if (!post) {
        return res.json({
            result: false,
            error: 'Post not found.',
        });
    }

    //Verif post appartient user
    if (post.userId.toString() !== userDetails._id.toString()) {
        return res.json({
            result: false,
            error: 'You cannot delete this post.',
        });
    }

    //Suppr post 
    await Post.deleteOne({ _id: postId });

    res.json({
        result: true,
        message: 'Post successfully deleted.',
        deletedPostId: postId,
    });

})

module.exports = router;
