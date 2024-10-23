const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const User = require('../models/User'); // User schema

const router = express.Router(); 

// Signup Route
router.post('/signup', async (req, res) => {
    console.log('Signup route hit');
    const { username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Create a new user instance without hashing the password here
        const newUser = new User({
            username,
            email,
            password // Plain text password; will be hashed in the pre-save hook
        });
        
        await newUser.save();
        res.status(201).json({ success: true, message: 'User registered successfully' });

    } catch (err) {
        console.error(err);

        // Handle duplicate key error (e.g., email already exists)
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Handle other errors (validation, etc.)
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    console.log('Login route hit');
    let { emailOrUsername, password } = req.body;

    emailOrUsername = emailOrUsername.trim().toLowerCase();

    try {
        // Find the user by email or username
        const user = await User.findOne({
            $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
        });

        if (!user) {
            console.log('User not found');
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Use the comparePassword method from the User model
        const isMatch = await user.comparePassword(password);
        console.log('Password match result:', isMatch);

        // Log for debugging
        console.log('Entered password:', password);
        console.log('Stored hashed password:', user.password);
        console.log('Password match result:', isMatch);

        if (!isMatch) {
            console.log('Password does not match');
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

       // Successful login
       res.status(200).json({ success: true, message: 'Login successful' });



    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/forgot-password', async (req, res) => {
    console.log('Forgot Password route hit'); // Add this line to verify route is hit
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            // Respond as if the email was found to avoid exposing which emails are registered
            return res.status(200).json({ success: true, message: 'If that email is registered, you will receive a password reset link.' });
        }
        // Generate a reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        
        // Hash the reset token before saving to the database
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration

        // Save user without running validation checks on other fields
        await user.save({ validateBeforeSave: false });

        // Log the reset link for testing purposes
        console.log(`Password reset link: http://localhost:3000/reset-password/${resetToken}`);

        res.status(200).json({ success: true, message: 'If that email is registered, you will receive a password reset link.' });
    } catch (error) {
        console.error('Error in forgot password route:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request.' });
    }
});


// Reset Password Route
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        // Hash the token to compare it to the stored hash
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find the user by the hashed reset token and ensure the token is still valid
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }, // Token should not be expired
        });

        if (!user) {
            return res.status(400).send('Invalid or expired token');
        }

        // Hash the new password and reset the token fields
        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        // Save the updated user with the new password
        await user.save();
        res.status(200).send('Password has been successfully reset');
    } catch (error) {
        console.error('Error in reset password route:', error);
        res.status(500).send('An error occurred while resetting your password.');
    }
});

module.exports = router;