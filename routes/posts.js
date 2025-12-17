var express = require("express");
var router = express.Router();

const { checkBody, getUser } = require("../modules/common");
const Post = require("../models/posts");
const Hashtag = require("../models/hashtags");

const POSTS_MAX_LENGTH = 280;

// --- ROUTE 1 : Créer un nouveau tweet ---
router.post("/", async (req, res, next) => {
  const { token, content } = req.body;

  // Vérification des champs
  if (!checkBody(req.body, ["token", "content"])) {
    res.json({ result: false, error: "Missing or empty fields." });
    return;
  }

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

  // 2. Transformation des noms en IDs MongoDB pour respecter ton schéma
  const hashtagIds = [];
  for (const name of hashtagsNames) {
    const hashtagDoc = await Hashtag.findOneAndUpdate(
      { name: name.toLowerCase() }, // Recherche par nom (minuscules)
      { name: name.toLowerCase() }, // Donnée à insérer si inexistant
      { upsert: true, new: true }   // Crée si absent, et renvoie le document
    );
    hashtagIds.push(hashtagDoc._id); // On récupère l'ID
  }

  // 3. Création du post avec les IDs de hashtags
  const newPost = new Post({
    content: content,
    createdAt: new Date(),
    type: "TWEET",
    userId: userDetails._id,
    hashtags: hashtagIds, // Utilisation du tableau d'IDs
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