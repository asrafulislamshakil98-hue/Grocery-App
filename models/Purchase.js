const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    companyName: String,
    items: Array, // বারকোড, নাম, কেনা, বেচা, পরিমাণ
    totalAmount: Number,
    paymentType: String, // cash or credit
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Purchase', purchaseSchema);