const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const Purchase = require('../models/Purchase');
const Product = require('../models/product');

// ১. শুধু নিজের দোকানের কোম্পানির লিস্ট পাওয়ার জন্য
router.get('/all', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ msg: "লগইন করুন" });

        // নিজের কোম্পানির লিস্ট ফিল্টার করা হয়েছে
        const companies = await Company.find({ userId: req.session.userId }).sort({ name: 1 });
        res.json(companies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ২. নতুন কোম্পানি যোগ করা (userId সহ)
router.post('/add', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ msg: "লগইন করুন" });

        const { name, phone, totalDue, address } = req.body;
        
        const newCompany = new Company({ 
            name, 
            phone, 
            totalDue: Number(totalDue) || 0,
            address: address || "",
            userId: req.session.userId // ডাটাবেজে আপনার আইডি সেভ হচ্ছে
        });

        await newCompany.save();
        res.status(201).json(newCompany);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ৩. কোম্পানি ডিলিট করার API (সুরক্ষিত)
router.delete('/:id', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ msg: "লগইন করুন" });

        // নিজের কোম্পানি ছাড়া অন্য কারওটা ডিলিট করতে পারবে না
        const result = await Company.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.session.userId 
        });

        if (!result) return res.status(404).json({ msg: "কোম্পানি পাওয়া যায়নি!" });

        res.json({ msg: "কোম্পানি সফলভাবে মুছে ফেলা হয়েছে!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// নির্দিষ্ট কোম্পানির সব ক্রয় ইতিহাস (তারিখ অনুযায়ী)
router.get('/purchases/:companyId', async (req, res) => {
    try {
        const history = await Purchase.find({ 
            companyId: req.params.companyId, 
            userId: req.session.userId 
        }).sort({ date: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json(err);
    }
});

// ১. কোম্পানিকে টাকা পরিশোধ করা (Pay)
router.patch('/pay/:id', async (req, res) => {
    try {
        const { amount } = req.body;
        const company = await Company.findOne({ _id: req.params.id, userId: req.session.userId });
        if (!company) return res.status(404).json({ msg: "কোম্পানি পাওয়া যায়নি" });

        company.totalDue -= Number(amount);
        await company.save();
        res.json({ msg: "টাকা পরিশোধ সফল!", currentDue: company.totalDue });
    } catch (err) {
        res.status(500).json(err);
    }
});

// ২. ক্রয়ের মেমো ডিলিট করা (Delete - এটি স্টক থেকেও মাল কমিয়ে দিবে)
router.delete('/purchase/:id', async (req, res) => {
    try {
        const purchase = await Purchase.findOne({ _id: req.params.id, userId: req.session.userId });
        if (!purchase) return res.status(404).json({ msg: "মেমো পাওয়া যায়নি" });

        // স্টক থেকে মাল কমানো
        for (let item of purchase.items) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
        }

        // কোম্পানির বাকি থেকে টাকা কমানো (যদি বাকি থাকে)
        if (purchase.paymentType === 'credit') {
            const company = await Company.findById(purchase.companyId);
            company.totalDue -= purchase.totalAmount;
            await company.save();
        }

        await Purchase.findByIdAndDelete(req.params.id);
        res.json({ msg: "মেমো ডিলিট এবং স্টক আপডেট সফল!" });
    } catch (err) {
        res.status(500).json(err);
    }
});

// মডিউল এক্সপোর্ট সবার শেষে থাকবে
module.exports = router;