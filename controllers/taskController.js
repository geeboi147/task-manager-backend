// controllers/taskController.js
const Task = require('../models/task');

const createTask = async (req, res) => {
  try {
    const { title, description, priority, deadline } = req.body;
    const userId = req.userId;

    const newTask = new Task({
      title,
      description,
      priority,
      deadline,
      user: userId
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { createTask };
