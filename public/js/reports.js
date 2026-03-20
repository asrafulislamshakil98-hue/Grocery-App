let allSales = [];
let groupedSales = {};
let currentSaleId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const res = await fetch('/api/sales/report/all');
    allSales = await res.json();
    
    // ১. তারিখ অনুযায়ী ডাটা গ্রুপ করা
    allSales.forEach(sale => {
        const date = new Date(sale.date).toLocaleDateString('bn-BD');
        if (!groupedSales[date]) groupedSales[date] = [];
        groupedSales[date].push(sale);
    });

    renderDateList();
});

// তারিখের বাটনগুলো তৈরি করা
function renderDateList() {
    const container = document.getElementById('dateListView');
    container.innerHTML = '';
    
    Object.keys(groupedSales).forEach(date => {
        const salesCount = groupedSales[date].length;
        container.innerHTML += `
            <div class="date-btn" onclick="showInvoicesForDate('${date}')">
                <b>${date}</b>
                <span>${salesCount} টি মেমো <i class="fa-solid fa-chevron-right"></i></span>
            </div>
        `;
    });
}

// নির্দিষ্ট তারিখের ইনভয়েস লিস্ট দেখানো
function showInvoicesForDate(date) {
    document.getElementById('dateListView').classList.add('hidden');
    document.getElementById('invoiceListView').classList.remove('hidden');
    document.getElementById('summaryBar').classList.remove('hidden');
    document.getElementById('selectedDateTitle').innerText = date + " এর বিক্রয়সমূহ";

    const container = document.getElementById('invoiceContainer');
    container.innerHTML = '';

    let totalDaySales = 0;
    let totalDayProfit = 0;
    let totalDayQty = 0;

    groupedSales[date].forEach(sale => {
        totalDaySales += sale.totalAmount;
        totalDayProfit += (sale.profit || 0);
        
        // মোট কয়টা আইটেম বিক্রি হলো
        const qtyCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
        totalDayQty += qtyCount;

        container.innerHTML += `
            <div class="invoice-item" onclick="openMemo('${sale._id}')">
                <div>
                    <b>${sale.customerName}</b><br>
                    <small>${new Date(sale.date).toLocaleTimeString('bn-BD')}</small>
                </div>
                <div style="text-align:right;">
                    <b>৳ ${sale.totalAmount}</b><br>
                    <small style="color:${sale.dueAmount > 0 ? 'red' : 'green'}">বাকি: ${sale.dueAmount}</small>
                </div>
            </div>
        `;
    });

    // সামারি আপডেট করা
    document.getElementById('sTotal').innerText = "৳" + totalDaySales;
    document.getElementById('sProfit').innerText = "৳" + totalDayProfit;
    document.getElementById('sQty').innerText = totalDayQty + " টি";
}

// ইনভয়েস মডাল ওপেন (মোবাইল ফিক্সড)
function openMemo(saleId) {
    const sale = allSales.find(s => s._id === saleId);
    if (!sale) return;

    currentSaleId = saleId;
    document.getElementById('mCustName').innerText = sale.customerName;
    document.getElementById('mDate').innerText = new Date(sale.date).toLocaleString('bn-BD');
    document.getElementById('mTotal').innerText = "৳" + sale.totalAmount;
    document.getElementById('mPaid').innerText = "৳" + sale.paidAmount;
    document.getElementById('mDue').innerText = "৳" + sale.dueAmount;

    const itemBody = document.getElementById('mItems');
    itemBody.innerHTML = '';
    sale.items.forEach(item => {
        itemBody.innerHTML += `
            <tr>
                <td>${item.name}</td>
                <td style="text-align:center;">${item.quantity}</td>
                <td style="text-align:right;">৳${item.price * item.quantity}</td>
            </tr>
        `;
    });

    document.getElementById('invoiceModal').style.display = 'flex';
}

// মেমো ডিলিট ফাংশন (আগের এপিআই অনুযায়ী)
async function deleteMemo() {
    if (confirm("এই মেমো ডিলিট করলে স্টক ফেরত যাবে। নিশ্চিত?")) {
        const res = await fetch(`/api/sales/delete/${currentSaleId}`, { method: 'DELETE' });
        if (res.ok) { alert("ডিলিট সফল!"); location.reload(); }
    }
}

function backToDates() {
    document.getElementById('dateListView').classList.remove('hidden');
    document.getElementById('invoiceListView').classList.add('hidden');
    document.getElementById('summaryBar').classList.add('hidden');
}

function closeModal() { document.getElementById('invoiceModal').style.display = 'none'; }