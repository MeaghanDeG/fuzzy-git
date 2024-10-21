const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User'); // User schema
const sendEmail = require('../utils/email');


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
    const { emailOrUsername, password } = req.body;

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

        // Log for debugging
        console.log('Entered password:', password);
        console.log('Stored hashed password:', user.password);
        console.log('Password match result:', isMatch);

        if (!isMatch) {
            console.log('Password does not match');
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Store user info in session and send success response
        req.session.user = user;
        res.json({ success: true, message: 'Login successful' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        // 1. Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'There is no user with that email.' });
        }

        // 2. Generate reset token
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        // 3. Send the reset token via email
        const resetURL = `http://localhost:3000/reset-password/${resetToken}`;
        const message = `Forgot your password? Reset it by clicking the link: ${resetURL}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Your password reset token (valid for 1 hour)',
                message
            });

            // For development, log the reset URL
            console.log('Password reset link:', resetURL);

            res.json({ success: true, message: 'Token sent to email!' });
        } catch (err) {
            console.error('Error sending email:', err);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save({ validateBeforeSave: false });

            res.status(500).json({ success: false, message: 'There was an error sending the email. Try again later.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// Reset Password Route
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    try {
        // Hash the token and find the user
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() } // Check if token has not expired
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Token is invalid or has expired' });
        }

        // Set the new password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});


module.exports = router;
