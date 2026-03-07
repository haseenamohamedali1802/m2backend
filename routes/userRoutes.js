const express = require("express");
const { protect } = require('../middleware/authMiddleware');
const {
  uploadProfilePicture,
  getUserProfile,
  updateUserProfile,
  searchUsers,
  followUser,
  unfollowUser,
} = require('../controllers/userController');

const router = express.Router();

// Upload profile picture
router.route('/profile/upload').post(protect, uploadProfilePicture);

// Get and update current user's profile
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Search users
router.route('/search').get(protect, searchUsers);

// Follow / unfollow other users
router.route('/follow/:id').post(protect, followUser);
router.route('/unfollow/:id').post(protect, unfollowUser);



module.exports = router;