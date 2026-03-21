const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const upload = require('../config/cloudinary'); // Multer & Cloudinary কনফিগ

// ১. নতুন ইউজার (মালিক) রেজিস্ট্রেশন
router.post('/register', async (req, res) => {
    try {
        const { username, password, shopName, address, phone } = req.body;

        // চেক করা হচ্ছে ইউজার আগে থেকেই আছে কি না
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ msg: "এই ইউজার নেমটি আগেই ব্যবহার হয়েছে!" });

        // পাসওয়ার্ড এনক্রিপ্ট করা
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            password: hashedPassword,
            shopName,
            address,
            phone
        });

        await newUser.save();
        res.status(201).json({ msg: "রেজিস্ট্রেশন সফল! এখন লগইন করুন।" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ২. লগইন রাউট
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) return res.status(400).json({ msg: "ইউজার পাওয়া যায়নি!" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "ভুল পাসওয়ার্ড!" });

        // সেশনে ইউজার আইডি সেভ করা
        req.session.userId = user._id;
        res.json({ msg: "লগইন সফল!", success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ৩. বর্তমান ইউজার চেক করা
router.get('/current-user', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ msg: "লগইন নেই" });
    const user = await User.findById(req.session.userId).select('-password');
    res.json(user);
});

// ৪. লগআউট
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

// প্রোফাইল এবং লোগো আপডেট করার এপিআই
router.put('/update-profile', upload.single('logo'), async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ msg: "লগইন নেই" });

        const { shopName, address } = req.body;
        let updateData = { shopName, address };

        // যদি নতুন কোনো ছবি আপলোড করা হয়
        if (req.file) {
            updateData.shopLogo = req.file.path; // ক্লাউডিনারি ছবির ইউআরএল (URL)
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.session.userId, 
            updateData, 
            { new: true }
        );

        res.json({ msg: "প্রোফাইল ও লোগো আপডেট হয়েছে!", user: updatedUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ইউজার নেম পরিবর্তন
router.put('/update-username', async (req, res) => {
    try {
        const { username } = req.body;
        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ msg: "ইউজার নেমটি খালি নেই" });

        await User.findByIdAndUpdate(req.session.userId, { username });
        res.json({ msg: "ইউজার নেম আপডেট সফল" });
    } catch (err) { res.status(500).json(err); }
});

// পাসওয়ার্ড পরিবর্তন
router.put('/change-password', async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.session.userId);

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ msg: "পুরানো পাসওয়ার্ড ভুল!" });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ msg: "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!" });
    } catch (err) { res.status(500).json(err); }
});

// সুপার অ্যাডমিন (আপনি) এর জন্য পাসওয়ার্ড রিসেট রাউট
router.put('/super-admin/reset-user-password', async (req, res) => {
    try {
        const { targetUsername, newPassword, masterSecret } = req.body;

        const MY_MASTER_KEY = process.env.MASTER_KEY; 
        // ১. মাস্টার কি চেক করা
        if (masterSecret !== MY_MASTER_KEY) {
            return res.status(403).json({ msg: "অ্যাক্সেস ডিনাইড! ভুল মাস্টার কি।" });
        }

        // ২. ইউজারকে খুঁজে বের করা
        const user = await User.findOne({ username: targetUsername });
        if (!user) {
            return res.status(404).json({ msg: "এই ইউজার নেমটি পাওয়া যায়নি!" });
        }

        // ৩. নতুন পাসওয়ার্ড এনক্রিপ্ট করা এবং সেভ করা
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ msg: `ইউজার '${targetUsername}' এর পাসওয়ার্ড সফলভাবে রিসেট হয়েছে!` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;