// Define our task schema
var mongoose = require('mongoose');

var TaskSchema = new mongoose.Schema({
    name: String,
    description: String,
    deadline: Date,
    completed: Boolean,
    assignedUser: { type: String, default: "" }, // _id field of the user
    assignedUserName: { type: String, default: "unassigned" }, // name field of the user
    dateCreated: { type: Date, default: Date.now } // set automatically by server
});

module.exports = mongoose.model('Task', TaskSchema);