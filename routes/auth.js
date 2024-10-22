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
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(200).send('If that email is registered, you will receive a password reset link.');
        }

        // Generate and hash token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration

        await user.save({ validateBeforeSave: false });

        // For now, console log the link for testing
        console.log(`Password reset link: http://localhost:3001/reset-password/${resetToken}`);

        res.status(200).send('If that email is registered, you will receive a password reset link.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error occurred');
    }
});



router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        // Hash the token to match what is stored in the database
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find the user by hashed reset token and ensure the token is still valid
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).send('Invalid or expired token');
        }

        // Hash the new password before saving
        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();
        res.status(200).send('Password has been successfully reset');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error occurred');
    }
});

module.exports = router;
