const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the User schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook to hash the password before saving to the database
userSchema.pre('save', async function(next) {
    const user = this;

    if (!user.isModified('password')) return next(); // Only hash if the password is new or modified

    try {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt); // Hash the password
        next();
    } catch (err) {
        next(err);
    }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password); // Compare entered password with hashed password
};

// Export the model
const User = mongoose.model('User', userSchema);

module.exports = User;
