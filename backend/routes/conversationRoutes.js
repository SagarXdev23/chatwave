const express = require('express');
const { 
    getGlobalConversation, 
    fetchConversations, 
    accessConversation, 
    updateDisappearingTimer,
    getConversationById
} = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/global').get(protect, getGlobalConversation);
router.route('/').get(protect, fetchConversations).post(protect, accessConversation);
router.route('/:id/timer').put(protect, updateDisappearingTimer);
router.route('/:id').get(protect, getConversationById);

module.exports = router;
