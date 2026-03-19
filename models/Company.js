const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    // সব স্কিমার ভেতর এটি যোগ করুন
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    name: { type: String, required: true },
    phone: String,
    totalDue: { type: Number, default: 0 }, // কোম্পানির কাছে আপনার মোট বাকি
    lastTransaction: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Company', companySchema);
