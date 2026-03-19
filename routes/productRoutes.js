const express = require('express');
const router = express.Router();
const Product = require('../models/product'); // মডেলের নামের বানান চেক করে নিন
const Company = require('../models/Company');
const Purchase = require('../models/Purchase');
const upload = require('../config/cloudinary'); // ক্লাউডিনারি কনফিগ

// ১. নতুন পণ্য যোগ করার মেইন রাউট (ছবি ও ইউজার আইডি সহ)
router.post('/add', upload.single('image'), async (req, res) => {
    try {
        // নিরাপত্তা চেক: ইউজার লগইন আছে কি না
        if (!req.session.userId) {
            return res.status(401).json({ msg: "সেশন শেষ হয়ে গেছে, আবার লগইন করুন!" });
        }

        const { 
            barcode, 
            name, 
            purchasePrice, 
            price, 
            stock, 
            category, 
            companyId, 
            paymentType 
        } = req.body;

        // ১. ক্লাউডিনারি থেকে ছবির লিঙ্ক নেওয়া
        const imageUrl = req.file ? req.file.path : "";

        // ২. কোম্পানি খুঁজে বের করা (নিশ্চিত করা যে কোম্পানিটিও ওই ইউজারেরই)
        let company = null;
        if (companyId) {
            company = await Company.findOne({ _id: companyId, userId: req.session.userId });
        }

        // ৩. নতুন পণ্য ডাটাবেজে সেভ করা (userId যুক্ত করে)
        const newProduct = new Product({
            userId: req.session.userId, // এই মালের মালিক এই ইউজার
            barcode: barcode || "",
            name: name,
            purchasePrice: Number(purchasePrice) || 0,
            price: Number(price) || 0,
            stock: Number(stock) || 0,
            category: category || "General",
            companyId: companyId || null,
            companyName: company ? company.name : "Unknown",
            image: imageUrl
        });

        await newProduct.save();

        // ৪. যদি কোম্পানি থেকে বাকিতে (Credit) কেনা হয়, তবে কোম্পানির বকেয়া বাড়ানো
        if (paymentType === 'credit' && company) {
            const totalBillToCompany = Number(purchasePrice) * Number(stock);
            company.totalDue += totalBillToCompany;
            await company.save();
        }

        res.status(201).json({ msg: "পণ্য ও কোম্পানির হিসাব সফলভাবে সেভ হয়েছে!" });

    } catch (err) {
        console.error("পণ্য যোগ করতে ভুল হয়েছে:", err);
        res.status(500).json({ error: err.message });
    }
});

// ২. শুধু নিজের দোকানের পণ্যের লিস্ট দেখার এপিআই
router.get('/all', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ msg: "লগইন প্রয়োজন!" });
        }

        // শুধু লগইন থাকা ইউজারের মালগুলোই খুঁজে বের করবে
        const products = await Product.find({ userId: req.session.userId }).sort({ _id: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// পণ্য ডিলিট করার এপিআই (আগে যা ছিল)
router.delete('/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ msg: "পণ্যটি মুছে ফেলা হয়েছে!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// পণ্য আপডেট করার এপিআই
router.put('/:id', async (req, res) => {
    try {
        const { name, purchasePrice, price, stock } = req.body;
        await Product.findByIdAndUpdate(req.params.id, {
            name, purchasePrice, price, stock
        });
        res.json({ msg: "আপডেট সফল!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/bulk-purchase', async (req, res) => {
    try {
        const { companyId, items, paymentType } = req.body;
        const Company = require('../models/Company');
        let totalPurchaseBill = 0;

        // ১. স্টক আপডেট করা
        for (let item of items) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.stock += item.quantity;
                product.purchasePrice = item.purchasePrice;
                product.price = item.price;
                await product.save();
                totalPurchaseBill += item.purchasePrice * item.quantity;
            }
        }

        // ২. কোম্পানির মেমো সেভ করা (ইতিহাসের জন্য)
        const company = await Company.findById(companyId);
        const newPurchase = new Purchase({
            userId: req.session.userId,
            companyId,
            companyName: company.name,
            items,
            totalAmount: totalPurchaseBill,
            paymentType
        });
        await newPurchase.save();

        // ৩. বাকি থাকলে কোম্পানির ডিউ আপডেট
        if (paymentType === 'credit') {
            company.totalDue += totalPurchaseBill;
            await company.save();
        }

        res.json({ msg: "Stock & History Updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;


