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