const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    barcode: { type: String, default: "" }, // এখানে কোনো unique বা sparse রাখার দরকার নেই
    purchasePrice: { type: Number, default: 0 },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    category: String,
    image: String,
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    companyName: String
}, { timestamps: true });

// কোডের শেষে শুধু এই একটি ইনডেক্স থাকবে যা ইউজার ভিত্তিক বারকোড ইউনিক করবে
productSchema.index({ userId: 1, barcode: 1 }, { unique: true, name: "user_barcode_unique" });
module.exports = mongoose.model('Product', productSchema);