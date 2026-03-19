const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    // সব স্কিমার ভেতর এটি যোগ করুন
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    address: String,
    totalDue: { type: Number, default: 0 }, // কাস্টমারের কাছে মোট পাওনা
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Customer', customerSchema);