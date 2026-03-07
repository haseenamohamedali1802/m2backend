const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { generateSecret, verifyToken } = require('../utils/twoFactorAuth');


// ================= SIGNUP =================
exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExistsEmail = await User.findOne({ email });
    const userExistsUsername = await User.findOne({ username });

    if (userExistsEmail || userExistsUsername) {
      return res.status(400).json({ message: "User Already Exists" });
    }

    const user = await User.create({
      username,
      email,
      password,
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
      twoFactorAuth: user.twoFactorAuth,
      twoFactorAuthSecret: user.twoFactorAuthSecret,
    });

  } catch (error) {
    console.log("SIGNUP ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};


// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password, token } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    // If 2FA enabled
    if (user.twoFactorAuth) {

      if (!token) {
        return res.status(400).json({ message: "2FA token required" });
      }

      if (!user.twoFactorAuthSecret) {
        return res.status(500).json({ message: "2FA secret missing" });
      }

      const isValid = verifyToken(user.twoFactorAuthSecret, token);

      if (!isValid) {
        return res.status(401).json({ message: "Invalid 2FA token" });
      }
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
      twoFactorAuth: user.twoFactorAuth,
      twoFactorAuthSecret: user.twoFactorAuthSecret,
    });

  } catch (error) {
    console.log("LOGIN ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};


// ================= ENABLE 2FA =================
exports.enableTwoFactorAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const secret = generateSecret();

    user.twoFactorAuth = true;
    user.twoFactorAuthSecret = secret.base32;

    await user.save();

    res.json({
      message: "Two-factor authentication is enabled",
      secret: secret.otpauth_url,
      twoFactorAuth: true,
      twoFactorAuthSecret: secret.base32,
    });

  } catch (error) {
    console.log("ENABLE 2FA ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};