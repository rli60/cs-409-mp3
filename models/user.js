// Load required packages
var mongoose = require('mongoose');

// Define our user schema
var UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    pendingTasks: { // _id fields of the pending tasks this user has
        type: [String],
        default: []
    },
    dateCreated: { // set automatically by server
        type: Date,
        default: Date.now
    }
});

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);
