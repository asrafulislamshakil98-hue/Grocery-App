let allSales = [];
let groupedSales = {};
let currentSaleId = null;

// ১. পেজ লোড হওয়ার সাথে সাথে সব রিপোর্ট নিয়ে আসবে
document.addEventListener('DOMContentLoaded', () => {
    fetchReports(); 
});

// ২. মেইন ফাংশন: ডাটা ফেচ করা এবং সামারি হিসাব করা
async function fetchReports() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    let url = '/api/sales/report/all';
    // যদি তারিখ সিলেক্ট করা থাকে তবে ইউআরএল এ যোগ হবে
    if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    try {
        const response = await fetch(url);
        allSales = await response.json();
        
        // তারিখ অনুযায়ী গ্রুপিং রিসেট করা
        groupedSales = {};
        allSales.forEach(sale => {
            const date = new Date(sale.date).toLocaleDateString('bn-BD');
            if (!groupedSales[date]) groupedSales[date] = [];
            groupedSales[date].push(sale);
        });

        // ৩. রেঞ্জ সামারি বক্স আপডেট করা (সিলেক্টেড তারিখের মোট হিসাব)
        if (startDate && endDate) {
            let rangeTotalSales = 0;
            let rangeTotalProfit = 0;
            let rangeTotalMemos = allSales.length;

            allSales.forEach(sale => {
                rangeTotalSales += sale.totalAmount;
                rangeTotalProfit += (sale.profit || 0);
            });

            // সামারি বক্স দেখানো এবং ডাটা বসানো
            document.getElementById('rangeSummary').classList.remove('hidden');
            document.getElementById('rangeTotalSales').innerText = `৳ ${rangeTotalSales}`;
            document.getElementById('rangeTotalProfit').innerText = `৳ ${rangeTotalProfit}`;
            document.getElementById('rangeTotalMemos').innerText = `${rangeTotalMemos} টি`;
        } else {
            // যদি সার্চ না করা থাকে তবে সামারি বক্স হাইড রাখা
            document.getElementById('rangeSummary').classList.add('hidden');
        }

        // তারিখের লিস্ট রেন্ডার করা
        renderDateList();

    } catch (err) {
        console.error("রিপোর্ট লোড করতে সমস্যা:", err);
    }
}

// ৪. তারিখের বাটনগুলো তৈরি করা
function renderDateList() {
    const container = document.getElementById('dateListView');
    container.innerHTML = '';
    
    // তারিখগুলো ক্রমানুসারে সাজানো (নতুন তারিখ উপরে)
    const dates = Object.keys(groupedSales).reverse();

    if (dates.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999; margin-top:20px;">কোনো বিক্রয় রেকর্ড পাওয়া যায়নি।</p>';
        return;
    }

    dates.forEach(date => {
        const salesCount = groupedSales[date].length;
        container.innerHTML += `
            <div class="date-btn" onclick="showInvoicesForDate('${date}')">
                <b>${date}</b>
                <span>${salesCount} টি মেমো <i class="fa-solid fa-chevron-right"></i></span>
            </div>
        `;
    });
}

// ৫. নির্দিষ্ট তারিখের ইনভয়েস লিস্ট দেখানো
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

    document.getElementById('sTotal').innerText = "৳" + totalDaySales;
    document.getElementById('sProfit').innerText = "৳" + totalDayProfit;
    document.getElementById('sQty').innerText = totalDayQty + " টি";
}

// ৬. ইনভয়েস মডাল ওপেন (বিস্তারিত মেমো)
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

// ৭. মেমো ডিলিট ফাংশন
async function deleteMemo() {
    if (confirm("এই মেমো ডিলিট করলে স্টক ফেরত যাবে। নিশ্চিত?")) {
        try {
            const res = await fetch(`/api/sales/delete/${currentSaleId}`, { method: 'DELETE' });
            if (res.ok) { 
                alert("মেমো সফলভাবে ডিলিট হয়েছে!"); 
                location.reload(); 
            }
        } catch (err) {
            alert("সার্ভার এরর!");
        }
    }
}

// ৮. নেভিগেশন ও মডাল ক্লোজ ফাংশন
function backToDates() {
    document.getElementById('dateListView').classList.remove('hidden');
    document.getElementById('invoiceListView').classList.add('hidden');
    document.getElementById('summaryBar').classList.add('hidden');
}

function closeModal() { 
    document.getElementById('invoiceModal').style.display = 'none'; 
}