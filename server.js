/**
 * AI Girlfriend Generator - Backend Server
 * Express server that handles image uploads and AI integration
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generateCoupleImage } = require('./utils/imageGenerator');
const { enhanceImage } = require('./utils/imageEnhancer');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${ext}`);
  }
});

// Configure multer for file uploads
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Only JPG, JPEG, and PNG files are allowed'));
    }
    cb(null, true);
  }
});

// Serve static files from public directory
app.use(express.static('public'));
app.use(express.json());

// Create directories for results if they don't exist
const resultsDir = path.join(__dirname, 'public', 'results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// API endpoint for image generation
app.post('/api/generate', upload.single('image'), async (req, res) => {
  try {
    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Get prompt from request
    const { prompt, presetPrompt } = req.body;
    const finalPrompt = prompt || presetPrompt;

    if (!finalPrompt) {
      return res.status(400).json({ error: 'No prompt provided' });
    }

    // Set paths for input and output
    const imagePath = req.file.path;
    const outputFilename = `result-${Date.now()}.png`;
    const outputPath = path.join(resultsDir, outputFilename);

    // Generate the image with girlfriend
    await generateCoupleImage(imagePath, finalPrompt, outputPath);

    // Return the URL to the generated image
    res.json({ 
      success: true, 
      imageUrl: `/results/${outputFilename}` 
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ 
      error: 'Failed to process image', 
      details: error.message 
    });
  }
});

// API endpoint for image enhancement
app.post('/api/enhance', express.json(), async (req, res) => {
  try {
    const { imagePath, fidelity } = req.body;

    // Validate inputs
    if (!imagePath) {
      return res.status(400).json({ error: 'No image path provided' });
    }

    // Ensure the image exists
    const fullImagePath = path.join(__dirname, 'public', imagePath);
    if (!fs.existsSync(fullImagePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Convert fidelity to number and validate
    const fidelityValue = parseFloat(fidelity);
    if (isNaN(fidelityValue) || fidelityValue < 0 || fidelityValue > 1) {
      return res.status(400).json({ error: 'Fidelity must be a number between 0 and 1' });
    }

    console.log(`Fidelity value: ${fidelityValue}, type: ${typeof fidelityValue}`);

    // Create output path for enhanced image
    const filename = path.basename(imagePath);
    const enhancedFilename = `enhanced-${filename}`;
    const outputPath = path.join(resultsDir, enhancedFilename);

    try {
      // Enhance the image
      await enhanceImage(fullImagePath, fidelityValue, outputPath);
    } catch (error) {
      console.error("Image enhancement failed:", error);
      return res.status(500).json({ 
        error: 'Failed to enhance image', 
        details: error.message 
      });
    }

    // Return the URL to the enhanced image
    const enhancedImageUrl = `/results/${enhancedFilename}`;
    res.json({ 
      success: true, 
      enhancedImageUrl 
    });
  } catch (error) {
    console.error('Error enhancing image:', error);
    res.status(500).json({ 
      error: 'Failed to enhance image', 
      details: error.message 
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});