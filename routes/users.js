// Handles /users and /users/:id
const User = require('../models/user')
const Task = require('../models/task')
const mongoose = require('mongoose')

module.exports = function (router) {
    // GET /api/users
    router.get('/', async function (req, res) {
        try {
            let where = {};

            // where
            if (req.query.where) {
                where = JSON.parse(req.query.where);
            }

            // count
            if (req.query.count == 'true') {
                const count = await User.countDocuments(where);

                return res.status(200).json({
                    message: "Users retrieved successfully.",
                    data: count
                });
            }

            // Create query
            let query = User.find(where);

            // sort
            if (req.query.sort) {
                const sort = JSON.parse(req.query.sort);
                query = query.sort(sort);
            }

            // select
            if (req.query.select) {
                const selectFields = JSON.parse(req.query.select);
                query = query.select(selectFields);
            }

            // skip
            if (req.query.skip != undefined) {
                const skip = parseInt(req.query.skip);
                query = query.skip(skip);
            }

            // limit
            if (req.query.limit != undefined) {
                const limit = parseInt(req.query.limit);
                query = query.limit(limit);
            }

            const users = await query;

            return res.status(200).json({
                message: "Users retrieved successfully.",
                data: users
            });

        } 
        catch (err) {
            if (err instanceof SyntaxError) {
                return res.status(400).json({
                    message: "Invalid query parameter.",
                    data: null
                });
            }

            return res.status(500).json({
                message: "Error retrieving users.",
                data: null
            });
        }
    });

    // POST /api/users
    router.post('/', async function (req, res) {
        // Create user
        try {
            const user = new User(req.body) // creates new User
            const savedUser = await user.save() // saves new User

            res.status(201).json({
                message: "User successfully created.",
                data: savedUser
            })
        }
        catch (err) {
            // Invalid input
            if (err.name == 'ValidationError' || err.name == 'CastError') {
                return res.status(400).json({
                    message: "Invalid user data.",
                    data: null
                });
            }

            if (err.code == 11000) {
                return res.status(400).json({
                    message: "Email already exists.",
                    data: null
                });
            }

            res.status(500).json({
                message: "Error creating user.",
                data: null
            })
        }
    });

    // GET /api/users/:id
    router.get('/:id', async function (req, res) {
        // Get specific user
        try {
            let query = User.findById(req.params.id);

            // select 
            if (req.query.select) {
                const selectFields = JSON.parse(req.query.select);
                query = query.select(selectFields);
            }

            const user = await query;

            if (!user) {
                return res.status(404).json({
                    message: "User does not exist.",
                    data: null
                })
            }

            res.status(200).json({
                message: "User retrieved successfully.",
                data: user
            })
        }
        catch (err) {
            if (err.name == 'CastError') {
                return res.status(404).json({
                    message: "Invalid user.",
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
                message: "Error retrieving user.",
                data: null
            })
        }
    });

    // PUT /api/users/:id
    router.put('/:id', async function (req, res) {
        try {
            // Find existing user
            const user = await User.findById(req.params.id);

            if (!user) {
                return res.status(404).json({
                    message: "User does not exist.",
                    data: null
                });
            }

            // Create new user from request body
            const newUser = new User(req.body);
            const newTasks = newUser.pendingTasks.map(id => id.toString());

            // Validate pendingTasks is an array
            if (
                req.body.pendingTasks !== undefined &&
                !Array.isArray(req.body.pendingTasks)
            ) {
                return res.status(400).json({
                    message: "pendingTasks must be an array.",
                    data: null
                });
            }

            // Validate task ID formats
            for (const id of newTasks) {
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    return res.status(400).json({
                        message: "Invalid task ID.",
                        data: null
                    });
                }
            }

            // Prevent duplicate task IDs
            if (new Set(newTasks).size !== newTasks.length) {
                return res.status(400).json({
                    message: "Duplicate task IDs are not allowed.",
                    data: null
                });
            }

            // Validate user fields
            await newUser.validate();

            // Check for duplicate email
            const duplicate = await User.findOne({
                email: newUser.email,
                _id: { $ne: user._id }
            });

            if (duplicate) {
                return res.status(400).json({
                    message: "Email already exists.",
                    data: null
                });
            }

            // Find and validate requested tasks
            const tasks = await Task.find({
                _id: { $in: newTasks }
            });

            if (tasks.length !== newTasks.length) {
                return res.status(404).json({
                    message: "Task does not exist.",
                    data: null
                });
            }

            // Pending tasks cannot be completed
            if (tasks.some(task => task.completed)) {
                return res.status(400).json({
                    message: "Cannot add completed tasks.",
                    data: null
                });
            }

            // Compare old and new pendingTasks
            const oldTasks = user.pendingTasks.map(id => id.toString());

            // Unassign tasks removed from the user's list
            for (const id of oldTasks) {
                if (!newTasks.includes(id)) {
                    await Task.findOneAndUpdate(
                        {
                            _id: id,
                            assignedUser: user._id.toString()
                        },
                        {
                            assignedUser: "",
                            assignedUserName: "unassigned"
                        }
                    );
                }
            }

            // Assign newly added tasks to this user
            for (const task of tasks) {
                if (!oldTasks.includes(task._id.toString())) {

                    // Remove task from its previous user's pendingTasks
                    if (task.assignedUser !== "") {
                        await User.findByIdAndUpdate(task.assignedUser, {
                            $pull: {
                                pendingTasks: task._id.toString()
                            }
                        });
                    }

                    task.assignedUser = user._id.toString();
                    task.assignedUserName = newUser.name;

                    await task.save();
                }
            }

            // Update user fields
            const oldName = user.name;

            user.name = newUser.name;
            user.email = newUser.email;
            user.pendingTasks = newTasks;

            const savedUser = await user.save();

            // Update assigned task names if user's name changed
            if (oldName !== newUser.name) {
                await Task.updateMany(
                    { assignedUser: user._id.toString() },
                    { assignedUserName: newUser.name }
                );
            }

            return res.status(200).json({
                message: "User successfully updated.",
                data: savedUser
            });

        } 
        catch (err) {
            if (err.name === 'CastError' && err.path === '_id') {
                return res.status(404).json({
                    message: "Invalid user ID.",
                    data: null
                });
            }

            if (err.name === 'ValidationError' || err.code === 11000) {
                return res.status(400).json({
                    message: "Invalid user data.",
                    data: null
                });
            }

            return res.status(500).json({
                message: "Error updating user.",
                data: null
            });
        }
    });

    // DELETE /api/users/:id
    router.delete('/:id', async function (req, res) {
        // Delete user
        try {
            const user = await User.findById(req.params.id);
            
            if (!user) {
                return res.status(404).json({
                    message: "User does not exist.",
                    data: null
                })
            }

            // Unassign all tasks belonging to this user
            await Task.updateMany(
                { assignedUser: user._id.toString() },
                {
                    assignedUser: "",
                    assignedUserName: "unassigned"
                }
            );
            
            await User.findByIdAndDelete(req.params.id);
            
            return res.status(204).send();
        }
        catch (err) {
            if (err.name == 'CastError' && err.path == '_id') {
                return res.status(404).json({
                    message: "User does not exist.",
                    data: null
                });
            }

            res.status(500).json({
                message: "Error deleting user.",
                data: null
            });
        }
    });

    return router;
};