var express = require("express");
var router = express.Router();

const twitter = require("twitter-text");

const { checkBody, getUser } = require("../modules/common");
const Post = require("../models/posts");
const Hashtag = require("../models/hashtags");

const POSTS_MAX_LENGTH = 280;

/* ==========================================
   POST : Création d’un post
========================================== */
router.post("/", async (req, res, next) => {
  const { token, content } = req.body;

  if (!checkBody(req.body, ["token", "content"])) {
    return res.json({
      result: false,
      error: "Missing or empty fields.",
    });
  }

  const postHashtagsTextList = twitter.extractHashtags(content);
  const postHashtagsRef = [];

  const userDetails = await getUser(token);

  if (!userDetails.result) {
    return res.json({
      result: false,
      error: "Invalid token.",
    });
  }

  if (content.length > POSTS_MAX_LENGTH) {
    return res.json({
      result: false,
      error: `Content too long. Max length is ${POSTS_MAX_LENGTH}.`,
    });
  }

  for (const hashtag of postHashtagsTextList) {
    let hashtagId = null;
    const dbHashtag = await Hashtag.findOne({
      name: new RegExp(`^${hashtag}$`, "i"),
    });

    if (!dbHashtag) {
      const newHashtag = new Hashtag({ name: hashtag });
      await newHashtag.save();
      hashtagId = newHashtag._id;
    } else {
      hashtagId = dbHashtag._id;
    }
    postHashtagsRef.push(hashtagId);
  }

  const newPost = new Post({
    content: content,
    userId: userDetails._id,
    hashtags: postHashtagsRef,
    likesId: [], 
  });

  await newPost.save();

  res.json({
    result: true,
    posts: [
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
        isOwner: true,
        isLiking: false,
        likesCount: 0,
      },
    ],
  });
});

/* ==========================================
   GET : Récupérer tous les tweets
========================================== */
router.get("/all", async (req, res) => {
  try {
    const token = req.headers.token;
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
      isLiking: post.likesId
        ?.map(id => id.toString())
        .includes(currentUserId),
      likesCount: post.likesId ? post.likesId.length : 0,
    }));

    res.json({ result: true, posts: enrichedPosts });
  } catch (error) {
    res.json({ result: false, error: error.message });
  }
});

/* ==========================================
   DELETE : Supprimer un post
========================================== */
router.delete("/", async (req, res) => {
  const { token, postId } = req.body;

  if (!checkBody(req.body, ["token", "postId"])) {
    return res.json({ result: false, error: "Missing or empty fields." });
  }

  const userDetails = await getUser(token);

  if (!userDetails.result) {
    return res.json({ result: false, error: "Invalid token." });
  }

  const post = await Post.findById(postId);

  if (!post) {
    return res.json({ result: false, error: "Post not found." });
  }

  if (post.userId.toString() !== userDetails._id.toString()) {
    return res.json({ result: false, error: "You cannot delete this post." });
  }

  await Post.deleteOne({ _id: postId });

  res.json({
    result: true,
    message: "Post successfully deleted.",
    deletedPostId: postId,
  });
});

/* ==========================================
   PATCH : Modifier contenu / Likes
========================================== */
router.patch("/", async (req, res) => {
  const { token, postId, content, isLiked } = req.body;

  if (!checkBody(req.body, ["token", "postId"])) {
    return res.json({ result: false, error: "Missing fields." });
  }

  const userDetails = await getUser(token);
  if (!userDetails.result) {
    return res.json({ result: false, error: "Invalid token." });
  }
  const userId = userDetails._id;

  const post = await Post.findById(postId);
  if (!post) {
    return res.json({ result: false, error: "Post not found." });
  }

  let postUpdated = false;
  let likeUpdated = false;

  /* ---------- CONTENU ---------- */
  if (content !== undefined) {
    if (post.userId.toString() !== userId.toString()) {
      return res.json({ result: false, error: "Unauthorized to edit this post." });
    }
    if (content.length > POSTS_MAX_LENGTH) {
      return res.json({ result: false, error: `Content too long. Max length is ${POSTS_MAX_LENGTH}.` });
    }
    post.content = content;
    postUpdated = true;
  }

  /* ---------- LIKES ---------- */
  if (isLiked !== undefined) {
    const userIdStr = userId.toString();
    const alreadyLiked = post.likesId.map((id) => id.toString()).includes(userIdStr);

    if (isLiked === true && !alreadyLiked) {
      post.likesId.push(userId);
      likeUpdated = true;
    } else if (isLiked === false && alreadyLiked) {
      post.likesId = post.likesId.filter((id) => id.toString() !== userIdStr);
      likeUpdated = true;
    }
  }

  if (postUpdated || likeUpdated) {
    await post.save();
  }

  res.json({
    result: true,
    message: "Post updated successfully.",
    postUpdated,
    likeUpdated,
    likesCount: post.likesId.length,
    isLiking: post.likesId.map((id) => id.toString()).includes(userId.toString()),
  });
});

module.exports = router;