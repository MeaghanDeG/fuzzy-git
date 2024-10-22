const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Import the crypto module
// const validator = require('validator'); // Uncomment if using validator

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        // validate: [validator.isEmail, 'Please provide a valid email'] // Uncomment if using validator
    },
    password: {
        type: String,
        required: true,
        minlength: 8 // Adjust as needed
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    createdAt: { type: Date, default: Date.now }
});

// Pre-save hook to hash the password
userSchema.pre('save', async function (next) {
    const user = this;

    // Only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    try {
        console.log('Presave hook:hashing password');
        user.password = await bcrypt.hash(user.password, 10);
        next();
    } catch (err) {
        console.errror('Error in hashing',err);
        next(err);
    }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Custom validation to require at least one of `username` or `email` (if both are not required)
userSchema.pre('validate', function (next) {
    if (!this.username && !this.email) {
        return next(new Error('Either username or email is required.'));
    }
    next();
});

// Method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Hash the token and set to resetPasswordToken field
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    // Set token expiration time (e.g., 1 hour)
    this.resetPasswordExpires = Date.now() + 3600000; // 1 hour in milliseconds
    return resetToken; // Return the plain token
};

// Export the model
const User = mongoose.model('User', userSchema);
module.exports = User;
