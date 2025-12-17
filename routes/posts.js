var express = require('express');
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
    const postHashtags = [];

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

    for (const hashtag of twitter.extractHashtags(content)) { // can't use "await" in a forEach ...
        const dbHashtag = await Hashtag.findOne({name: new RegExp(`^${hashtag}$`, 'i')});
        if (dbHashtag) {
            // le hastag existe, on pouse son id dans la liste des references du post
            postHashtags.push(dbHashtag._id);
        } else {
            // il faut creer le hashtag avant de pousser l'id dans les ref du post
        }
    }

	const newPost = await new Post({
        content: content,
		userId: userDetails._id,
        hashtags: postHashtags,
	});
	
	await newPost.save();

	res.json({
        result: true,
        postId: newPost._id, 
        createdByFullName: userDetails.fullName, 
        createdByUsername: userDetails.username, 
        createdAt:newPost.createdAt, 
        content: newPost.content, 
        // hashTags[]
    });

});

module.exports = router;
