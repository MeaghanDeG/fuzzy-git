const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User'); // Assuming you have a User model in models/User.js
const authRoutes = require('./routes/auth'); // Import the auth routes
const cors = require('cors');

dotenv.config();

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Use the auth routes
app.use(cors({
    origin: 'http://127.0.0.1:3001',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true 
}));

// Middleware
app.use(express.json());

    // Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Session middleware for handling user sessions
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }  // Set secure to true if using HTTPS
}));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));


app.use('/auth', authRoutes);
 

// Default route for homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
