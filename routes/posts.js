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

// --- ROUTE 1 : Créer un nouveau tweet ---
router.post("/", async (req, res, next) => {
  const { token, content } = req.body;

    const postHashtags = [];

  // Récupération de l'utilisateur via le token
  const userDetails = getUser(token);
  if (!userDetails.result) {
    res.json({ result: false, error: "Invalid token." });
    return;
  }

  // Vérification de la longueur du contenu
  if (content.length > POSTS_MAX_LENGTH) {
    res.json({ result: false, error: `Content too long.` });
    return;
  }

  // --- LOGIQUE HASHTAGS : TEXTE -> IDS ---
  // 1. Extraction des noms (ex: ["h1", "h2"])
  const matches = content.match(/#[a-zA-Z0-9_-]+/g) || [];
  const hashtagsNames = [...new Set(matches.map((tag) => tag.substring(1)))];

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
    createdAt: newPost.createdAt,
    content: newPost.content,
    hashTags: hashtagsNames, // On renvoie le texte pour faciliter le front
  });
});

// --- ROUTE 2 : Récupérer tous les tweets (Ordre descendant) ---
router.get("/all", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("userId")    // Récupère les infos du User (nom, etc.)
      .populate("hashtags")  // Remplace les IDs par les objets Hashtags { _id, name }
      .sort({ createdAt: -1 });

    res.json({ result: true, posts: posts });
  } catch (error) {
    res.json({ result: false, error: error.message });
  }
});

module.exports = router;