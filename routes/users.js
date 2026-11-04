// Handles /users and /users/:id
const User = require('../models/user')

module.exports = function (router) {
    // GET /api/users
    router.get('/', async function (req, res) {
        // Get all users
        try {
            const users = await User.find()

            res.status(200).json({
                message: "Users retrieved successfully.",
                data: users
            })
        }
        catch (err) {
            res.status(500).json({
                message: "Error retrieving users.",
                data: null
            })
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
            if (err.name === 'ValidationError' || err.name === 'CastError') {
                return res.status(400).json({
                    message: "Invalid user data.",
                    data: null
                });
            }

            if (err.code === 11000) {
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
            const user = await User.findById(req.params.id)

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
            if (err.name === 'CastError') {
                return res.status(404).json({
                    message: "Invalid user.",
                    data: null
                })
            }
        
            res.status(500).json({
                message: "Error retrieving user.",
                data: null
            })
        }
    });

    // // PUT /api/users/:id
    // router.put('/:id', function (req, res) {
    //     // Update user
    // });

    // // DELETE /api/users/:id
    // router.delete('/:id', function (req, res) {
    //     // Delete user
    // });

    return router;
};