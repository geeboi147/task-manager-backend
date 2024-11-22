const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');

// Models and Routes
const User = require('./models/User');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/auth');
const verifyToken = require('./middleware/authMiddleware'); // JWT middleware

// Load environment variables
dotenv.config();

// Initialize the app
const app = express();

// Middleware setup
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse incoming JSON requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
  next(); // Continue to the next middleware or route handler
});

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limit file size to 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Invalid file type. Only images are allowed.'));
    }
    cb(null, true);
  },
});

// Routes
app.use('/api/auth', authRoutes); // Authentication routes
app.use('/api/tasks', taskRoutes); // Task management routes

// **Profile Picture Upload Route** - Protected
app.post(
  '/api/upload-profile-picture',
  verifyToken, // Ensure route is protected
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Prepare the image data to save in MongoDB
      const imageData = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };

      // Update the user's profile picture in the database
      const updatedUser = await User.findByIdAndUpdate(
        req.userId, // Ensure `req.userId` is set by `verifyToken`
        { profilePicture: imageData },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ message: 'Profile picture uploaded successfully' });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      res.status(500).json({
        message: 'Profile picture upload failed',
        error: error.message,
      });
    }
  }
);

// **Retrieve Profile Picture Route** - Protected
app.get('/api/profile-picture', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId, 'profilePicture');

    if (!user || !user.profilePicture) {
      return res.status(404).json({ message: 'Profile picture not found' });
    }

    // Send the image data as a response
    res.set('Content-Type', user.profilePicture.contentType);
    res.send(user.profilePicture.data);
  } catch (error) {
    console.error('Error retrieving profile picture:', error);
    res.status(500).json({
      message: 'Unable to retrieve profile picture',
      error: error.message,
    });
  }
});

// **Database Connection**
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if DB connection fails
  });

// **Global Error Handler** for unhandled routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// **Server Listener**
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
