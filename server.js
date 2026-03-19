const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

dotenv.config();
const app = express();

// ১. Middleware (ডাটা রিসিভ করার জন্য)
app.use(express.json());
app.use(cors());

// ২. সেশন সেটআপ (লগইন ধরে রাখার জন্য অত্যন্ত জরুরি)
app.use(session({
    secret: 'my-grocery-store-secret-key', // আপনি চাইলে যেকোনো বড় নাম দিতে পারেন
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // ২৪ ঘণ্টা লগইন থাকবে
}));

// ৩. Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch(err => console.error("Database error:", err));

// ৪. নিরাপত্তা চেক মিডলওয়্যার (লগইন না থাকলে লগইন পেজে পাঠিয়ে দিবে)
const checkAuth = (req, res, next) => {
    if (!req.session.userId) {
        // যদি ইউজার লগইন না থাকে তবে তাকে লগইন পেজে পাঠাবে
        return res.redirect('/login.html');
    }
    next();
};

// ৫. ওপেন পেজ (লগইন ছাড়াও এই ২টা পেজ দেখা যাবে)
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));

// ৬. প্রটেক্টেড পেজ (এই পেজগুলো দেখতে হলে অবশ্যই লগইন করতে হবে)
app.get('/', checkAuth, (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/index.html', checkAuth, (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/stock.html', checkAuth, (req, res) => res.sendFile(path.join(__dirname, 'public', 'stock.html')));
app.get('/pos.html', checkAuth, (req, res) => res.sendFile(path.join(__dirname, 'public', 'pos.html')));
app.get('/reports.html', checkAuth, (req, res) => res.sendFile(path.join(__dirname, 'public', 'reports.html')));
app.get('/daily-summary.html', checkAuth, (req, res) => res.sendFile(path.join(__dirname, 'public', 'daily-summary.html')));
app.get('/registration.html', checkAuth, (req, res) => res.sendFile(path.join(__dirname, 'public', 'registration.html')));
app.get('/register-product.html', checkAuth, (req, res) => res.sendFile(path.join(__dirname, 'public', 'register-product.html')));
app.get('/register-customer.html', checkAuth, (req, res) => res.sendFile(path.join(__dirname, 'public', 'register-customer.html')));
app.get('/register-company.html', checkAuth, (req, res) => res.sendFile(path.join(__dirname, 'public', 'register-company.html')));
app.get('/company.html', checkAuth, (req, res) => res.sendFile(path.join(__dirname, 'public', 'company.html')));
app.get('/credits.html', checkAuth, (req, res) => res.sendFile(path.join(__dirname, 'public', 'credits.html')));
app.get('/manage-users.html', checkAuth, (req, res) => res.sendFile(path.join(__dirname, 'public', 'manage-users.html')));
app.get('/graphs.html', checkAuth, (req, res) => res.sendFile(path.join(__dirname, 'public', 'graphs.html')));

// ৭. স্ট্যাটিক ফাইল (CSS, JS, Images)
app.use(express.static('public'));

// ৮. এপিআই রাউটস (এগুলো অবশ্যই থাকতে হবে)
app.use('/api/auth', require('./routes/authRoutes')); // লগইন/রেজিস্ট্রেশন এপিআই
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/companies', require('./routes/companyRoutes')); 
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));

// ৯. সার্ভার চালু করা
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running at http://localhost:${PORT}`));