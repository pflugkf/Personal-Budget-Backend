const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    budget: {
        type: Number,
        required: true,
        min: 1
    },
    color: {
        type: String,
        required: true,
        minlength: 6
    },
    user: {
        type: mongoose.Schema.Types.ObjectId, ref: 'users'
    }
}, {collection: 'budget'});

module.exports = mongoose.model('budget', budgetSchema);