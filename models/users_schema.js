const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 6
    },
    password: {//encrypt this
        type: String,
        required: true,
        unique: true,
        minlength: 6
    },
    budget: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'budget-items'
    }]
}, {collection: 'users'});

module.exports = mongoose.model("users", userSchema);