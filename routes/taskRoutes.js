const express = require('express');
const Task = require('../models/task');
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');
const multer = require('multer');

const router = express.Router();

// Multer setup for in-memory file storage with file type and size limits
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limit file size to 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Invalid file type. Only images are allowed.'));
    }
    cb(null, true);  // Proceed with the upload
  },
});

// Centralized error response handler
const handleError = (res, error, message, statusCode = 500) => {
  console.error(message, error);
  res.status(statusCode).json({ message });
};

// Create a task (protected)
router.post('/', verifyToken, async (req, res) => {
  const { title, priority, description, deadline } = req.body;

  if (!title || !priority) {
    return res.status(400).json({ message: 'Title and priority are required' });
  }

  try {
    const newTask = new Task({
      title,
      priority,
      description,
      deadline: deadline ? new Date(deadline) : undefined, // Ensure deadline is a valid date
      user: req.userId,
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    handleError(res, err, 'Error creating task');
  }
});

// Get all tasks with pagination (protected)
router.get('/', verifyToken, async (req, res) => {
  const { page = 1, limit = 10 } = req.query; // Default to page 1 with 10 tasks per page

  try {
    const tasks = await Task.find({ user: req.userId })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalTasks = await Task.countDocuments({ user: req.userId });

    res.status(200).json({
      tasks,
      totalTasks,
      totalPages: Math.ceil(totalTasks / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    handleError(res, err, 'Error fetching tasks');
  }
});

// Update a task (protected)
router.put('/:id', verifyToken, async (req, res) => {
  const { title, priority, description, deadline, status } = req.body;

  try {
    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { title, priority, description, deadline, status },
      { new: true, runValidators: true } // Ensure validation is applied
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json(updatedTask);
  } catch (err) {
    handleError(res, err, 'Error updating task');
  }
});

// Delete a task (protected)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    handleError(res, err, 'Error deleting task');
  }
});

// Route to upload profile picture (protected) - using MongoDB for storage
router.post('/upload-profile-picture', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check for valid image types
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Invalid file type. Only images are allowed.' });
    }

    // Prepare the image data to save in MongoDB
    const imageData = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    };

    // Update the user profile with the new image
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { profilePicture: imageData },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      profilePicture: updatedUser.profilePicture, // Return the profile picture data
    });
  } catch (err) {
    handleError(res, err, 'Error uploading profile picture');
  }
});

module.exports = router;
