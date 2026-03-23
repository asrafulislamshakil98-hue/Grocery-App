const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    name: { type: String, required: true },
    // এখান থেকে unique: true সরিয়ে ফেলা হয়েছে
    barcode: { type: String, sparse: true }, 
    purchasePrice: { type: Number, default: 0 },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    category: String,
    image: String,
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    companyName: String
}, { timestamps: true });

// এটিই আসল সমাধান: userId এবং barcode একসাথে ইউনিক হবে
productSchema.index({ userId: 1, barcode: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);