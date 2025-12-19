var express = require("express");
var router = express.Router();

const twitter = require('twitter-text');

// X provides an Open Source twitter-text library that can be found on GitHub
// https://github.com/twitter/twitter-text/blob/master/js/README.md

// const usernames = twitter.extractMentions("Mentioning @twitter and @jack")
// // usernames == ["twitter", "jack"]

// const html = twitter.autoLink("link @user, please #request");
// // html == link @<a class="tweet-url username" href="https://twitter.com/user" data-screen-name="user" rel="nofollow">user</a>, please <a href="https://twitter.com/search?q=%23request" title="#request" class="tweet-url hashtag" rel="nofollow">#request</a>

// const hashTags = twitter.extractHashtags("link @user, please #request #WooT")
// hashTags == [ 'request', 'WooT' ]

const { checkBody, getUser } = require('../modules/common');
const Post = require('../models/posts');
const Hashtag = require('../models/hashtags');

const POSTS_MAX_LENGTH = 280;



router.post('/', async (req, res, next) => {

    const { token, content } = req.body;
    const postHashtagsTextList = twitter.extractHashtags(content);
    const postHashtagsRef = [];

    if (!checkBody(req.body, ['token', 'content'])) {
        res.json({
            result: false,
            error: 'Missing or empty fields.'
        });
        return;
    }

    const userDetails = await getUser(token);

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

    for (const hashtag of postHashtagsTextList) { // can't use "await" in a forEach ...

        let hashtagId = null; // the _id of the hastag, straight from db if retrieved, or from db after inster

        const dbHashtag = await Hashtag.findOne({name: new RegExp(`^${hashtag}$`, 'i')});

        if (!dbHashtag) { // if hastag doesnt exist we create it

          const newHashtag = await new Hashtag({
            name: hashtag,
          });
          
          await newHashtag.save(); // then save it

          hashtagId = newHashtag._id; // then we have its _id

        } else { // we already retrieved the hashtag _id from db

          hashtagId = dbHashtag._id;

        }

        postHashtagsRef.push(hashtagId); // lets add to the lists of the hashtags of that post
    }

	const newPost = await new Post({
    content: content,
		userId: userDetails._id,
    hashtags: postHashtagsRef,
	});
	

    await newPost.save();

    res.json({
        result: true,
        posts:[
          {
            _id: newPost._id, 
            content: newPost.content, 
            type: "TWEET",
            userId: {
              username: userDetails.username,
              fullName: userDetails.fullName,
            },
            createdAt: newPost.createdAt, 
            hashTags: postHashtagsTextList,
            isOwner: true, // always true since its the purpose of this route
            isLiking: false, // its benne created righ now so no one can like this post yet
          },
        ]
    });

});

// --- ROUTE 2 : Récupérer tous les tweets (Ordre descendant) ---
router.get("/all", async (req, res) => {
  try {
    const token = req.headers.authorization;
    const userDetails = await getUser(token);

    if (!userDetails.result) {
      return res.json({ result: false, error: "Token invalide" });
    }

    const currentUserId = userDetails._id.toString();

    const posts = await Post.find()
      .populate("userId", "username fullName")
      .populate("hashtags")
      .sort({ createdAt: -1 })
      .lean();

    const enrichedPosts = posts.map(post => ({
      ...post,
      isOwner: post.userId._id.toString() === currentUserId,
      isLiking: Array.isArray(post.likesId) && post.likesId.includes(currentUserId)
    }));

    res.json({ result: true, posts: enrichedPosts });
  } catch (error) {
    res.json({ result: false, error: error.message });
  }
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
    const userDetails = await getUser(token);

    if (!userDetails.result) {
        res.json({
            result: false,
            error: 'Invalid token.'
        });
    }

    // Verif post existe
    const post = await Post.findById(postId);

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

// PATCH d'un Post. Modifiable uniquement par le créateur du post

router.patch('/', async (req, res) => {
    const { token, postId, content, isLiked } = req.body;

    // Verif champs
    if (!checkBody(req.body, ['token', 'postId'])) {
        return res.json({
            result: false,
            error: 'Missing or empty fields.',
        });
    }

    // Verif token 
    const userDetails = await getUser(token);

    if (!userDetails.result) {
        res.json({
            result: false,
            error: 'Invalid token.'
        });
    }

    // Verif post existe
    const post = await Post.findById(postId);

    if (!post) {
        return res.json({
            result: false,
            error: 'Post not found.',
        });
    }

    let postUpdated = false;
    let likeUpdated = false;

    // Modif du content
    if (content !== undefined) {
        // Vérifier que c'est le créateur du post
        if (post.userId.toString() !== userDetails._id.toString()) {
            return res.json({
                result: false,
                error: 'Unauthorized to edit this post.',
            });
        }

        if (content.length > POSTS_MAX_LENGTH) {
            return res.json({
                result: false,
                error: `Content too long. Max length is ${POSTS_MAX_LENGTH}.`,
            });
        }

        post.content = content;

        await post.save();
        postUpdated = true;
    }

    // gestion des likes
    if (isLiked !== undefined) {
        const existingLike = await Like.findOne({
            userId: userDetails._id,
            postId: postId,
        });

        if (isLiked === true && !existingLike) {
            const newLike = new Like({
                userId: userDetails._id,
                postId: postId,
            });
            await newLike.save();
            likeUpdated = true;
        }

        if (isLiked === false && existingLike) {
            await Like.deleteOne({ _id: existingLike._id });
            likeUpdated = true;
        }
    }


    res.json({
        result: true,
        message: 'Post updated successfully.',
        postUpdated,
        likeUpdated,
    });
})

module.exports = router;