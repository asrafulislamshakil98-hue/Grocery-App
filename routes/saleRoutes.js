const express = require('express');
const router = express.Router();
const Sale = require('../models/sale'); // নিশ্চিত হোন ফাইলের নাম Sale.js
const Product = require('../models/product'); // নিশ্চিত হোন ফাইলের নাম Product.js
const mongoose = require('mongoose');
const Expense = require('../models/Expense');


// ১. নতুন বিক্রয় যোগ করা (আগের কোডটি এখানেও আছে)
// routes/saleRoutes.js - নতুন আপডেট
router.post('/add', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ msg: "লগইন করুন" });

        const { customerName, items, paidAmount, customerId } = req.body; // কাস্টমার আইডি লাগবে
        const currentUserId = req.session.userId;

        let totalAmount = 0;
        let totalCost = 0;

        for (let item of items) {
            const product = await Product.findOne({ _id: item.productId, userId: currentUserId });
            if (product) {
                product.stock -= item.quantity;
                await product.save();
                totalAmount += product.price * item.quantity;
                totalCost += (product.purchasePrice || 0) * item.quantity;
            }
        }

        const dueAmount = totalAmount - Number(paidAmount);

        const newSale = new Sale({
            userId: currentUserId,
            customerName: customerName || "Cash Customer",
            items: items,
            totalAmount: totalAmount,
            paidAmount: Number(paidAmount),
            dueAmount: dueAmount,
            totalCost: totalCost,
            profit: totalAmount - totalCost,
            date: new Date()
        });

        await newSale.save();

        // --- নতুন কোড: কাস্টমারের বকেয়া আপডেট করা ---
        if (customerId && dueAmount > 0) {
            const Customer = require('../models/Customer');
            await Customer.findByIdAndUpdate(customerId, {
                $inc: { totalDue: dueAmount } // আগের বাকির সাথে নতুন বাকি যোগ হবে
            });
        }

        res.status(201).json({ msg: "বিক্রি সফল হয়েছে!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ২. বিস্তারিত রিপোর্টের জন্য এপিআই (UserId ফিল্টারসহ)
router.get('/report/all', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ msg: "লগইন নেই" });

        const { startDate, endDate } = req.query;
        let query = { userId: new mongoose.Types.ObjectId(req.session.userId) }; // নিজের ডাটা ফিল্টার

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59))
            };
        }

        const sales = await Sale.find(query).sort({ date: -1 });
        res.json(sales);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ৩. গ্রাফের জন্য ডাটা (UserId ফিল্টারসহ)
router.get('/graph/monthly-trend', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ msg: "লগইন নেই" });

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const trend = await Sale.aggregate([
            { 
                $match: { 
                    userId: new mongoose.Types.ObjectId(req.session.userId), // এই ইউজারের ডাটা
                    date: { $gte: thirtyDaysAgo } 
                } 
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    totalSales: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);
        res.json(trend);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ৪. ড্যাশবোর্ড সামারি রিপোর্ট (UserId ফিল্টারসহ)
router.get('/dashboard-stats', async (req, res) => {
    try {
        // ১. চেক করা ইউজার লগইন আছে কি না
        if (!req.session.userId) return res.status(401).json({ msg: "লগইন নেই" });

        const today = new Date();
        today.setHours(0, 0, 0, 0); // আজকের শুরুর সময় (রাত ১২টা)
        const userId = new mongoose.Types.ObjectId(req.session.userId);

        // ২. আজকের বিক্রয় রিপোর্ট (বিক্রি, ক্যাশ, বাকি ও মোট লাভ)
        const salesStats = await Sale.aggregate([
            { 
                $match: { 
                    userId: userId,
                    date: { $gte: today } 
                } 
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$totalAmount" },
                    // নগদ জমার ক্ষেত্রে বিলের চেয়ে বেশি টাকা ধরবে না (খুচরা ফেরত দেওয়ার কেস)
                    totalCash: { 
                        $sum: { 
                            $cond: [{ $gt: ["$paidAmount", "$totalAmount"] }, "$totalAmount", "$paidAmount"] 
                        } 
                    },
                    // শুধু যেগুলো প্রকৃত বাকি (Bill > Paid) সেগুলো যোগ করবে
                    totalDue: { 
                        $sum: { 
                            $cond: [{ $gt: ["$dueAmount", 0] }, "$dueAmount", 0] 
                        } 
                    },
                    grossProfit: { $sum: "$profit" } // খরচ ছাড়া লাভ
                }
            }
        ]);

        // ৩. আজকের মোট খরচের হিসাব
        const expenseStats = await Expense.aggregate([
            { 
                $match: { 
                    userId: userId, 
                    date: { $gte: today } 
                } 
            },
            { 
                $group: { 
                    _id: null, 
                    totalExpense: { $sum: "$amount" } 
                } 
            }
        ]);

        // ৪. কম স্টকের পণ্যের সংখ্যা
        const lowStockCount = await Product.countDocuments({ 
            userId: req.session.userId, 
            stock: { $lt: 5 } 
        });

        // ৫. ডাটা সংগ্রহ করা (যদি ডাটা না থাকে তবে ০ ধরবে)
        const sales = salesStats[0] || { totalSales: 0, totalCash: 0, totalDue: 0, grossProfit: 0 };
        const expense = expenseStats[0]?.totalExpense || 0;
        
        // নিট লাভ = মোট গ্রস লাভ - মোট খরচ
        const netProfit = sales.grossProfit - expense;

        // ৬. ফ্রন্টএন্ডে ডাটা পাঠানো
        res.json({
            totalSales: sales.totalSales,
            totalCash: sales.totalCash,
            totalDue: sales.totalDue,
            totalExpense: expense,
            totalProfit: netProfit, // এটিই আপনার আসল লাভ
            lowStockCount: lowStockCount
        });

    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        res.status(500).json({ error: err.message });
    }
});


// ৫. মেমো ডিলিট করা
router.delete('/delete/:id', async (req, res) => {
    try {
        const sale = await Sale.findOne({ _id: req.params.id, userId: req.session.userId });
        if (!sale) return res.status(404).json({ msg: "মেমো পাওয়া যায়নি!" });

        for (let item of sale.items) {
            await Product.findOneAndUpdate(
                { _id: item.productId, userId: req.session.userId },
                { $inc: { stock: item.quantity } }
            );
        }

        await Sale.findByIdAndDelete(req.params.id);
        res.json({ msg: "সফলভাবে ডিলিট হয়েছে!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ৩. আজকের বিস্তারিত বিক্রয় তালিকা দেখা
router.get('/today', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sales = await SaleModel.find({ date: { $gte: today } }).sort({ date: -1 });
        res.json(sales);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// বাকির তালিকা পাওয়ার জন্য (UserId ফিল্টারসহ)
router.get('/due-list', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ msg: "লগইন নেই" });

        // শুধু ওই ইউজারের ডাটা এবং যেখানে dueAmount ০ এর বেশি
        const dueSales = await Sale.find({ 
            userId: req.session.userId, 
            dueAmount: { $gt: 0 } 
        }).sort({ date: -1 });

        res.json(dueSales);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// বাকির টাকা জমা নেওয়া (Update Payment)
router.patch('/pay-due/:id', async (req, res) => {
    try {
        const saleId = req.params.id;
        const { amount } = req.body; // কাস্টমার কত টাকা দিলো

        const sale = await Sale.findOne({ _id: saleId, userId: req.session.userId });
        
        if (!sale) return res.status(404).json({ msg: "মেমো পাওয়া যায়নি!" });

        // জমার পরিমাণ বাড়ানো এবং বাকির পরিমাণ কমানো
        sale.paidAmount += Number(amount);
        sale.dueAmount -= Number(amount);

        await sale.save();
        res.json({ msg: "টাকা জমা সফল হয়েছে!", currentDue: sale.dueAmount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
