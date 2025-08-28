const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUser } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');  // your JWT auth middleware

router.post('/register', registerUser);
router.post('/login', loginUser);

// Add this route to serve logged-in user info
router.get('/user', authMiddleware, getUser);

module.exports = router;
