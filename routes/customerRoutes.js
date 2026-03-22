const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// ১. কাস্টমার রেজিস্ট্রেশন (userId সহ)
router.post('/add', async (req, res) => {
    try {
        // নিরাপত্তা চেক: ইউজার লগইন আছে কি না
        if (!req.session.userId) {
            return res.status(401).json({ msg: "লগইন প্রয়োজন!" });
        }

        const { name, phone, address } = req.body;

        const newCustomer = new Customer({ 
            name, 
            phone, 
            address,
            userId: req.session.userId // সঠিক জায়গায় ইউজারের আইডি সেট করা হয়েছে
        });

        await newCustomer.save();
        res.status(201).json({ msg: "কাস্টমার রেজিস্ট্রেশন সফল!" });
    } catch (err) {
        // যদি একই মোবাইল নম্বর দিয়ে অন্য কেউ অলরেডি রেজিস্ট্রেশন করে থাকে
        res.status(400).json({ msg: "এই কাস্টমার বা মোবাইল নম্বরটি আপনার লিস্টে অলরেডি আছে!" });
    }
});

// ২. শুধু নিজের দোকানের কাস্টমার লিস্ট পাওয়া
router.get('/all', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ msg: "লগইন করুন!" });
        }

        // শুধু বর্তমান ইউজারের কাস্টমারদেরই ডাটাবেজ থেকে খুঁজে বের করবে
        const customers = await Customer.find({ userId: req.session.userId }).sort({ name: 1 });
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// নির্দিষ্ট কাস্টমারের তথ্য দেখা
router.get('/:id', async (req, res) => {
    try {
        const customer = await Customer.findOne({ _id: req.params.id, userId: req.session.userId });
        if (!customer) return res.status(404).json({ msg: "কাস্টমার পাওয়া যায়নি" });
        res.json(customer);
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;