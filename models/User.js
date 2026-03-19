const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    shopName: { type: String, default: "আমার মুদি দোকান" },
    address: { type: String, default: "ঠিকানা দেওয়া হয়নি" },
    phone: { type: String, default: "" },
    shopLogo: { type: String, default: "" }, // ক্লাউডিনারি লোগো ইউআরএল
    role: { type: String, default: 'admin' }
});

module.exports = mongoose.model('User', userSchema);