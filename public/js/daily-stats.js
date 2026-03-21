document.addEventListener('DOMContentLoaded', loadStats);

async function loadStats() {
    try {
        const response = await fetch('/api/sales/dashboard-stats');
        const data = await response.json();

        // UI তে ডাটা বসানো
        document.getElementById('totalSales').innerText = `৳ ${data.totalSales || 0}`;
        document.getElementById('totalCash').innerText = `৳ ${data.totalCash || 0}`;
        document.getElementById('totalDue').innerText = `৳ ${data.totalDue || 0}`;
        document.getElementById('totalProfit').innerText = `৳ ${data.totalProfit || 0}`;

    } catch (error) {
        console.error('Error loading summary stats:', error);
    }
}

// daily-stats.js এর loadStats ফাংশনের ভেতর এটি যোগ করুন

async function loadStats() {
    try {
        const response = await fetch('/api/sales/dashboard-stats');
        const data = await response.json();

        // আগের ৪টি লাইন থাকবে...
        document.getElementById('totalSales').innerText = `৳ ${data.totalSales || 0}`;
        document.getElementById('totalCash').innerText = `৳ ${data.totalCash || 0}`;
        document.getElementById('totalDue').innerText = `৳ ${data.totalDue || 0}`;
        document.getElementById('totalProfit').innerText = `৳ ${data.totalProfit || 0}`;

        // নতুন খরচের লাইনটি যোগ করুন
        document.getElementById('totalExpense').innerText = `৳ ${data.totalExpense || 0}`;

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}