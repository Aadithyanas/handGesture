require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const screenshotRoutes = require('./routes/screenshotRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));


// Routes
app.use('/api/screenshots', screenshotRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));