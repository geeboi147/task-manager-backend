
// models/task.js
const mongoose = require('mongoose');


const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
    priority: {
        type: String,
        required: true,
        enum: ['High', 'Medium', 'Low'],
    },
    deadline: {
        type: Date,
        default: null,
    },
    status: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'In Progress', 'Completed'],
    },
    user: {  // Reference to the User model
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });


const Task = mongoose.model('Task', taskSchema);


module.exports = Task;
