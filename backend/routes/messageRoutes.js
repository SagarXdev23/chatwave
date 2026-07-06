const express = require('express');
const { getMessages, sendMessage, sendImageMessage, editMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Both routes are protected
router.route('/:conversationId').get(protect, getMessages);
router.route('/').post(protect, sendMessage);
router.post('/image', protect, upload.single('image'), sendImageMessage);
router.put('/:id', protect, editMessage);

module.exports = router;
