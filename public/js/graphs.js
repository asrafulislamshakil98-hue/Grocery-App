document.addEventListener('DOMContentLoaded', fetchGraphData);

async function fetchGraphData() {
    try {
        const response = await fetch('/api/sales/graph/monthly-trend');
        const data = await response.json();

        // তারিখ এবং বিক্রয়ের পরিমাণ আলাদা করা
        const labels = data.map(item => {
            const date = new Date(item._id);
            return date.getDate() + "/" + (date.getMonth() + 1); // ফরম্যাট: দিন/মাস
        });
        const salesValues = data.map(item => item.totalSales);

        // গ্রাফ তৈরি করা
        const ctx = document.getElementById('salesChart').getContext('2d');
        new Chart(ctx, {
            type: 'line', // আপনি চাইলে 'bar' ও দিতে পারেন
            data: {
                labels: labels,
                datasets: [{
                    label: 'মোট বিক্রি (৳)',
                    data: salesValues,
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 3,
                    tension: 0.4, // গ্রাফটি বাঁকানো বা স্মুথ করার জন্য
                    fill: true,
                    pointBackgroundColor: '#3498db'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) { return '৳' + value; }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });

    } catch (err) {
        console.error("গ্রাফ ডাটা লোড করতে সমস্যা:", err);
    }
}