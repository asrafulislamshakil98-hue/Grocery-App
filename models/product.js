const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    // ১. এই ইউজার আইডি-টি ব্র্যাকেটের ভেতরে থাকতে হবে
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    name: { type: String, required: true },
    barcode: { type: String, unique: true, sparse: true },
    purchasePrice: { 
        type: Number, 
        default: 0 
    },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    category: String,
    image: String,
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }, 
    companyName: String
}, { timestamps: true }); // এটি দিলে মাল কবে এন্ট্রি হয়েছে তা জানা যাবে

module.exports = mongoose.model('Product', productSchema);