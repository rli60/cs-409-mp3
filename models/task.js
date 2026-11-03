// Define our task schema
var mongoose = require('mongoose');

var TaskSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    deadline: {
        type: Date,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    assignedUser: { // _id field of the user
        type: String,
        default: ""
    },
    assignedUserName: { // name field of the user
        type: String,
        default: "unassigned"
    },
    dateCreated: { // set automatically by server
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Task', TaskSchema);