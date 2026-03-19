const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    customerName: String,
    items: Array,
    totalAmount: Number,
    paidAmount: Number,
    dueAmount: Number,
    totalCost: Number,
    profit: Number,
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sale', saleSchema);