const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Générer JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "your_secret_key", {
    expiresIn: "24h",
  });
};

// SIGNUP
exports.signup = async (req, res) => {
  try {
    const { username, fullName, email, password } = req.body;

    // Validation basique
    if (!username || !fullName || !email || !password) {
      return res.status(400).json({
        result: false,
        error: "All fields are required.",
      });
    }

    // Vérifier si l'username existe déjà (case-insensitive)
    const existingUserByUsername = await User.findOne({
      username: username.toLowerCase(),
    });

    if (existingUserByUsername) {
      return res.status(400).json({
        result: false,
        error: "Username not available.",
      });
    }

    // Vérifier si l'email existe déjà
    const existingUserByEmail = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUserByEmail) {
      return res.status(400).json({
        result: false,
        error: "Email already registered.",
      });
    }

    // Générer le token
    const newToken = generateToken(null); // Token sans userId d'abord

    // Créer nouvel utilisateur
    const user = new User({
      username: username.toLowerCase(),
      fullName,
      email: email.toLowerCase(),
      password,
      token: newToken,
    });

    await user.save();

    // Générer un nouveau token avec l'ID du nouvel utilisateur
    const finalToken = generateToken(user._id);

    // Mettre à jour le token dans la BD
    user.token = finalToken;
    await user.save();

    res.status(201).json({
      result: true,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      token: finalToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      result: false,
      error: "Server error. Please try again later.",
    });
  }
};

// SIGNIN
exports.signin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation basique
    if (!username || !password) {
      return res.status(400).json({
        result: false,
        error: "Username and password are required.",
      });
    }

    // Trouver l'utilisateur par username (case-insensitive)
    const user = await User.findOne({
      username: username.toLowerCase(),
    });

    if (!user) {
      return res.status(400).json({
        result: false,
        error: "Wrong username or password.",
      });
    }

    // Vérifier le password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(400).json({
        result: false,
        error: "Wrong username or password.",
      });
    }

    // Générer nouveau token
    const token = generateToken(user._id);

    // Mettre à jour le token dans la BD
    user.token = token;
    await user.save();

    res.status(200).json({
      result: true,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      result: false,
      error: "Server error. Please try again later.",
    });
  }
};
