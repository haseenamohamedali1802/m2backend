const asyncHandler = require('express-async-handler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');


// ================= MULTER SETUP =================
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    if (['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, JPG, PNG are allowed.'));
    }
  },
});

// ================= PROFILE UPLOAD =================
const uploadProfilePicture = [
  upload.single('profilePicture'),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Remove old profile picture if exists
    if (user.profilePicture) {
      const oldPath = `.${user.profilePicture}`; // /uploads/filename
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    user.profilePicture = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({
      message: 'Profile picture updated successfully',
      profilePicture: user.profilePicture,
    });
  }),
];

// ================= GET PROFILE =================
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('followers following')
    .select('-password');

  if (!user) return res.status(404).json({ message: 'User not found' });

  res.json(user);
});

// ================= UPDATE PROFILE =================
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.username = req.body.username || user.username;
  user.email = req.body.email || user.email;
  if (req.body.password) user.password = req.body.password;

  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    username: updatedUser.username,
    email: updatedUser.email,
    profilePicture: updatedUser.profilePicture,
    followers: updatedUser.followers,
    following: updatedUser.following,
  });
});

// ================= SEARCH USERS =================
const searchUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.keyword
    ? { username: { $regex: req.query.keyword, $options: 'i' } }
    : {};
  const users = await User.find({ ...keyword }).select('-password');
  res.json(users);
});


// ================= FOLLOW USER =================
const followUser = asyncHandler(async (req, res) => {
  const userToFollow = await User.findById(req.params.id);
  const currentUser = await User.findById(req.user._id);

  if (!userToFollow || !currentUser)
    return res.status(404).json({ message: 'User not found' });

  if (userToFollow._id.equals(currentUser._id))
    return res.status(400).json({ message: 'You cannot follow yourself' });

  if (!currentUser.following.some(f => f.equals(userToFollow._id))) {
    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);
    await currentUser.save();
    await userToFollow.save();
    res.json({ message: 'User followed successfully' });
  } else {
    res.status(400).json({ message: 'Already following this user' });
  }
});

// ================= UNFOLLOW USER =================
const unfollowUser = asyncHandler(async (req, res) => {
  const userToUnfollow = await User.findById(req.params.id);
  const currentUser = await User.findById(req.user._id);

  if (!userToUnfollow || !currentUser)
    return res.status(404).json({ message: 'User not found' });

  if (userToUnfollow._id.equals(currentUser._id))
    return res.status(400).json({ message: 'You cannot unfollow yourself' });

  if (currentUser.following.some(f => f.equals(userToUnfollow._id))) {
    currentUser.following = currentUser.following.filter(
      f => !f.equals(userToUnfollow._id)
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      f => !f.equals(currentUser._id)
    );
    await currentUser.save();
    await userToUnfollow.save();
    res.json({ message: 'User unfollowed successfully' });
  } else {
    res.status(400).json({ message: 'You are not following this user' });
  }
});

module.exports = {
  uploadProfilePicture,
  getUserProfile,
  updateUserProfile,
  searchUsers,
  followUser,
  unfollowUser,

};