async function loadExpenseSummary() {
    const res = await fetch('/api/expenses/summary');
    const data = await res.json();
    const list = document.getElementById('expList'); // নিশ্চিত করুন এই আইডিটি আছে
    list.innerHTML = '<h3 style="margin-top:20px; font-size:1rem; color:#666;">খরচের ইতিহাস (তারিখ অনুযায়ী):</h3>';

    data.forEach(item => {
        const dateBn = new Date(item._id).toLocaleDateString('bn-BD');
        list.innerHTML += `
            <div class="date-item" onclick="showDateDetails('${item._id}')">
                <div>
                    <b>${dateBn}</b><br>
                    <small style="color:#7f8c8d;">${item.count} টি খরচ</small>
                </div>
                <div style="color:#e74c3c; font-weight:bold;">৳ ${item.totalAmount}</div>
            </div>
        `;
    });
}

// নির্দিষ্ট তারিখের বিস্তারিত দেখানো
async function showDateDetails(dateStr) {
    const res = await fetch(`/api/expenses/date/${dateStr}`);
    const expenses = await res.json();
    
    document.getElementById('modalDate').innerText = new Date(dateStr).toLocaleDateString('bn-BD') + " এর খরচ";
    const detailsDiv = document.getElementById('modalDetails');
    detailsDiv.innerHTML = '';

    expenses.forEach(ex => {
        detailsDiv.innerHTML += `
            <div class="detail-row">
                <span>${ex.title}</span>
                <b>৳ ${ex.amount}</b>
            </div>
        `;
    });

    document.getElementById('expenseModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('expenseModal').style.display = 'none';
}

// পেজ লোড হওয়ার সময় কল করুন
loadExpenseSummary();