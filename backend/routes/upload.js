const express = require('express');
const router = express.Router();
const path = require('path'); // Add this line to require 'path'
const multer = require('multer');
const uploadController = require('../controllers/uploadController');

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // Use path.extname
    }
});

const upload = multer({ storage: storage });

// Define the POST route for file upload
router.post('/', upload.single('file'), uploadController.uploadFile);

module.exports = router;
