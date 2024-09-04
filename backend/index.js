const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Route handlers
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Middleware for serving frontend static files from the correct directory
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded


app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// Catch-all route to serve the index page (or redirect as needed)
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// Catch-all route for frontend (for single-page apps or simple HTML app)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// Route to serve the login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public', 'login.html'));
});

// Route to serve the registration page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public', 'register.html'));
});

// Route to serve the upload page
app.get('/upload', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public', 'upload.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

