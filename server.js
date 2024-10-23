// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const app = express();

// CORS configuration to allow requests from your frontend
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Explicitly allow localhost and 127.0.0.1
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true, // Allow credentials (cookies, sessions)
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight requests
app.options('*', cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], 
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware to parse incoming JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
// Session management

app.use(session({
    secret: process.env.SECRET_KEY, // Load from .env
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true, // Helps prevent cross-site scripting attacks
    }
}));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

app.use('/auth', authRoutes);

//Serve static files (e.g., your HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));


// Serve the index.html file as a homepage (if needed)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Test route to verify the server is working
app.get('/test', (req, res) => {
    res.send('Server is working!');
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
