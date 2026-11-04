// Handle /tasks and /tasks/:id
const Task = require('../models/task');

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
                query = query.select(req.query.select.replace(/,/g, ' '));
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
            if (err.name === 'CastError') {
                return res.status(404).json({
                    message: "Invalid task.",
                    data: null
                })
            }
        
            res.status(500).json({
                message: "Error retrieving task.",
                data: null
            })
        }
    });

    // // PUT /api/tasks/:id
    // router.put('/:id', function (req, res) {
    //     // Update task
    // });

    // // DELETE /api/tasks/:id
    // router.delete('/:id', function (req, res) {
    //     // Delete task
    // });

    return router;
};