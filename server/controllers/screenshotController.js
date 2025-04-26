const Screenshot = require('../models/Screenshot');
const fs = require('fs');
const path = require('path');

// Upload screenshot
// controllers/screenshotController.js
exports.uploadScreenshot = async (req, res) => {
    try {
      console.log('Upload request received'); // Debug log
      console.log('Files:', req.files); // Debug log
      console.log('File:', req.file); // Debug log
      
      if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).json({ message: 'No file uploaded' });
      }
  
      // Create a URL-accessible path
      const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  
      const screenshot = new Screenshot({
        image: imageUrl, // Store the URL instead of the path
      });
  
      await screenshot.save();
      console.log('Screenshot saved:', screenshot); // Debug log
      res.status(201).json({
        message: 'Screenshot uploaded successfully',
        screenshot: {
          id: screenshot._id,
          imageUrl: imageUrl
        }
      });
    } catch (err) {
      console.error('Error in uploadScreenshot:', err); // More detailed error
      res.status(500).json({ 
        message: 'Server Error',
        error: err.message // Include the actual error message
      });
    }
  };
// Get latest screenshot
// backend/controllers/screenshotController.js
exports.getLatestScreenshot = async (req, res) => {
    try {
      const screenshot = await Screenshot.findOne().sort({ createdAt: -1 });
      
      if (!screenshot) {
        return res.status(404).json({ message: 'No screenshots found' });
      }
  
      // Return the image URL or the full document
      res.json({
        imageUrl: screenshot.image,
        createdAt: screenshot.createdAt
      });
      
    } catch (err) {
      console.error('Error in getLatestScreenshot:', err);
      res.status(500).json({ 
        message: 'Server Error',
        error: err.message
      });
    }
  };