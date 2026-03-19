const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const mongoose = require('mongoose');

// ১. নতুন খরচ যোগ করা
router.post('/add', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ msg: "লগইন নেই" });
        const { title, amount } = req.body;
        const newExpense = new Expense({
            userId: req.session.userId,
            title,
            amount: Number(amount)
        });
        await newExpense.save();
        res.status(201).json({ msg: "খরচ সেভ হয়েছে!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ২. তারিখ অনুযায়ী গ্রুপ করা সামারি পাওয়া
router.get('/summary', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ msg: "লগইন নেই" });
        const userId = new mongoose.Types.ObjectId(req.session.userId);

        const summary = await Expense.aggregate([
            { $match: { userId: userId } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": -1 } } // নতুন তারিখ সবার উপরে
        ]);
        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ৩. নির্দিষ্ট তারিখের সব খরচ দেখা
router.get('/date/:dateStr', async (req, res) => {
    try {
        const userId = req.session.userId;
        const start = new Date(req.params.dateStr);
        const end = new Date(req.params.dateStr);
        end.setDate(end.getDate() + 1);

        const details = await Expense.find({
            userId,
            date: { $gte: start, $lt: end }
        });
        res.json(details);
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;