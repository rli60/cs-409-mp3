// Handle /tasks and /tasks/:id
const Task = require('../models/task');
const User = require('../models/user');
const mongoose = require('mongoose');

module.exports = function (router) {
    // GET /api/tasks
    router.get('/', async function (req, res) {
        // Get all tasks
        try {
            const tasks = await Task.find()

            res.status(200).json({
                message: "Task retrieved successfully.",
                data: tasks
            })
        }
        catch (err) {
            res.status(500).json({
                message: "Error retrieving tasks.",
                data: null
            })
        }
    });

    // POST /api/tasks
    router.post('/', async function (req, res) {
        // Create task
        try {
            const task = new Task(req.body) // creates new Task
            const savedTask = await task.save() // saves new Task

            res.status(201).json({
                message: "Task successfully created.",
                data: savedTask
            })
        }
        catch (err) {
            // Invalid input
            if (err.name === 'ValidationError' || err.name === 'CastError') {
                return res.status(400).json({
                    message: "Invalid task data.",
                    data: null
                });
            }

            res.status(500).json({
                message: "Error creating task.",
                data: null
            })
        }
    });

    // GET /api/tasks/:id
    router.get('/:id', async function (req, res) {
        // Get specific task
        try {
            let query = Task.findById(req.params.id);

            if (req.query.select) {
                const selectFields = JSON.parse(req.query.select);
                query = query.select(selectFields);
            }

            const task = await query;

            if (!task) {
                return res.status(404).json({
                    message: "Task does not exist.",
                    data: null
                })
            }

            res.status(200).json({
                message: "Task retrieved successfully.",
                data: task
            })
        }
        catch (err) {
            if (err.name == 'CastError') {
                return res.status(404).json({
                    message: "Invalid task.",
                    data: null
                })
            }

            if (err instanceof SyntaxError) {
                return res.status(400).json({
                    message: "Invalid select query.",
                    data: null
                });
            }
        
            res.status(500).json({
                message: "Error retrieving task.",
                data: null
            })
        }
    });

    // PUT /api/tasks/:id
    router.put('/:id', async function (req, res) {
        try {
            const task = await Task.findById(req.params.id)

            if (!task) {
                return res.status(404).json({
                    message: "Task does not exist.",
                    data: null
                })
            }

            const oldAssignedUser = task.assignedUser
            const newTask = new Task(req.body)
            let assignedUser = null

            if (newTask.assignedUser == "") {
                newTask.assignedUserName = "unassigned"
            }
            else {
                if (!mongoose.Types.ObjectId.isValid(newTask.assignedUser)) {
                    return res.status(400).json({
                        message: "Invalid assigned user ID.",
                        data: null
                    })
                }

                assignedUser = await User.findById(newTask.assignedUser)

                if (!assignedUser) {
                    return res.status(404).json({
                        message: "Assigned user does not exist.",
                        data: null
                    })
                }

                if (
                    req.body.assignedUserName != undefined &&
                    req.body.assignedUserName != assignedUser.name
                ) {
                    return res.status(400).json({
                        message: "Assigned username does not match the user.",
                        data: null
                    })
                }

                newTask.assignedUserName = assignedUser.name
            }

            // Replace task fields while preserving original ID and date
            task.name = newTask.name
            task.description = newTask.description
            task.deadline = newTask.deadline
            task.completed = newTask.completed
            task.assignedUser = newTask.assignedUser
            task.assignedUserName = newTask.assignedUserName

            const savedTask = await task.save();

            // Remove task from the previous user's pendingTasks
            if (oldAssignedUser != "") {
                await User.findByIdAndUpdate(oldAssignedUser, {
                    $pull: {
                        pendingTasks: task._id.toString()
                    }
                })
            }

            // Add task to the new user's pendingTasks
            if (newTask.assignedUser != "" && newTask.completed == false) {
                await User.findByIdAndUpdate(newTask.assignedUser, {
                    $addToSet: {
                        pendingTasks: task._id.toString()
                    }
                })
            }

            res.status(200).json({
                message: "Task successfully updated.",
                data: savedTask
            })
        }
        catch (err) {
            if (err.name == 'CastError' && err.path == '_id') {
                return res.status(404).json({
                    message: "Task does not exist.",
                    data: null
                });
            }

            if (err.name == 'ValidationError' || err.name == 'CastError') {
                return res.status(400).json({
                    message: "Invalid task data.",
                    data: null
                });
            }

            res.status(500).json({
                message: "Error updating task.",
                data: null
            });
        }
    });

    // DELETE /api/tasks/:id
    router.delete('/:id', async function (req, res) {
        // Delete task
        try {
            const task = await Task.findById(req.params.id);

            if (!task) {
                return res.status(404).json({
                    message: "Task does not exist.",
                    data: null
                })
            }

            if (task.assignedUser != "") {
                // Remove task id from user's pending task
                await User.findByIdAndUpdate(task.assignedUser, {
                    $pull: {
                        pendingTasks: task._id.toString()
                    }
                });
            }

            await Task.findByIdAndDelete(req.params.id);

            return res.status(204).send();
        }
        catch (err) {
            if (err.name == 'CastError' && err.path == '_id') {
                return res.status(404).json({
                    message: "Task does not exist.",
                    data: null
                });
            }

            res.status(500).json({
                message: "Error deleting task.",
                data: null
            });
        }
    });

    return router;
};