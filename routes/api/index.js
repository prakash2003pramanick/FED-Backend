const express = require('express');
const router = express.Router();

// Define your routes here
router.get('/isWorking', (req, res) => {
    res.send('api.js file is working');
});

// Authentication Routes 
router.use('/auth', require('./auth/authRoutes'))

// User Routes
router.use('/user', require('./user/userRoutes'));

// Event routes 
router.use('/form', require('./forms/formRoutes'));

// Debug middleware to log all requests
router.use('*', (req, res, next) => {
    console.log(`[DEBUG] Request to: ${req.method} ${req.originalUrl}`);
    console.log(`[DEBUG] Request headers:`, req.headers);
    next();
});

router.use('/certificate', require('./certificate/certificateRoute'));

router.use('/blog', require('./blog'));

router.use('/gemini', require('./blog/ai/gemini'));

module.exports = router; // Ensure you are exporting the router
