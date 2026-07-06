const express = require('express');
const { searchUsers, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, searchUsers);
router.route('/profile').put(protect, updateProfile);

module.exports = router;
