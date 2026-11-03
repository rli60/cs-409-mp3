// Handles /users and /users/:id

module.exports = function (router) {
    // GET /api/users
    router.get('/', function (req, res) {
        // Get all users
    });

    // POST /api/users
    router.post('/', function (req, res) {
        // Create user
    });

    // GET /api/users/:id
    router.get('/:id', function (req, res) {
        // Get specific user
    });

    // PUT /api/users/:id
    router.put('/:id', function (req, res) {
        // Update user
    });

    // DELETE /api/users/:id
    router.delete('/:id', function (req, res) {
        // Delete user
    });

    return router;
};