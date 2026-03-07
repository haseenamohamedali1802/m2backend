const speakeasy = require("speakeasy");

exports.generateSecret = () => {
  const secret = speakeasy.generateSecret({
    name: "SocialMediaGuvi",
  });
  return secret;
};

exports.verifyToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1, // allow 30s window before/after
  });
};