let allSalesData = [];
let currentSale = null;

document.addEventListener('DOMContentLoaded', fetchDueSales);

async function fetchDueSales() {
    try {
        const response = await fetch('/api/sales/due-list');
        allSalesData = await response.json();
        renderCustomerList();
    } catch (err) {
        console.log("Error loading due sales");
    }
}

// ১. কাস্টমারদের নাম অনুযায়ী গ্রুপ করা
function renderCustomerList() {
    const container = document.getElementById('customerListContainer');
    container.innerHTML = '';

    // ইউনিক কাস্টমার এবং তাদের মোট বাকি বের করা
    const summary = {};
    allSalesData.forEach(sale => {
        if (!summary[sale.customerName]) {
            summary[sale.customerName] = { totalDue: 0, sales: [] };
        }
        summary[sale.customerName].totalDue += sale.dueAmount;
        summary[sale.customerName].sales.push(sale);
    });

    Object.keys(summary).forEach(name => {
        const card = document.createElement('div');
        card.className = 'customer-card';
        card.onclick = () => showHistory(name, summary[name].sales);
        card.innerHTML = `
            <div>
                <h3>${name}</h3>
                <small>${summary[name].sales.length} বার কেনাকাটা</small>
            </div>
            <div class="total-due">৳ ${summary[name].totalDue}</div>
        `;
        container.appendChild(card);
    });
}

// ২. নির্দিষ্ট কাস্টমারের তারিখ অনুযায়ী হিস্ট্রি দেখানো
function showHistory(name, sales) {
    document.getElementById('histName').innerText = name;
    const list = document.getElementById('historyList');
    list.innerHTML = '';

    sales.forEach(sale => {
        const date = new Date(sale.date).toLocaleString('bn-BD');
        const div = document.createElement('div');
        div.style = "padding:12px; background:#f8f9fa; margin-bottom:8px; border-radius:8px; cursor:pointer; display:flex; justify-content:space-between;";
        div.onclick = () => showMemo(sale);
        div.innerHTML = `
            <span>${date}</span>
            <b>৳ ${sale.dueAmount} বাকি</b>
        `;
        list.appendChild(div);
    });
    document.getElementById('historyModal').style.display = 'flex';
}

// ৩. ৫ কলামের ডিজিটাল মেমো দেখানো
function showMemo(sale) {
    currentSale = sale;
    document.getElementById('memoCustInfo').innerText = sale.customerName;
    document.getElementById('memoDate').innerText = new Date(sale.date).toLocaleString('bn-BD');
    
    const body = document.getElementById('memoBody');
    body.innerHTML = '';
    
    sale.items.forEach(item => {
        const row = `
            <tr>
                <td>${item.barcode || '---'}</td>
                <td><b>${item.name}</b></td>
                <td style="text-align:center;">${item.quantity}</td>
                <td>${sale.discount || 0}</td>
                <td style="text-align:right;">৳ ${item.price * item.quantity}</td>
            </tr>
        `;
        body.innerHTML += row;
    });

    document.getElementById('memoTotal').innerText = `৳ ${sale.totalAmount}`;
    document.getElementById('memoDue').innerText = `৳ ${sale.dueAmount}`;
    
    document.getElementById('memoModal').style.display = 'flex';
}

// টাকা জমা নেওয়ার আসল ফাংশন
async function collectPayment() {
    if (!currentSale) return;

    const amount = prompt(`কাস্টমারের বর্তমান বাকি: ৳${currentSale.dueAmount}\nকত টাকা জমা নিবেন?`);

    if (amount === null || amount === "" || isNaN(amount)) {
        return; // ক্যানসেল করলে বা ভুল লিখলে কিছু হবে না
    }

    const payAmount = parseFloat(amount);

    if (payAmount <= 0) {
        alert("সঠিক পরিমাণ লিখুন!");
        return;
    }

    if (payAmount > currentSale.dueAmount) {
        alert("বাকি টাকার চেয়ে বেশি জমা নেওয়া সম্ভব নয়!");
        return;
    }

    try {
        const res = await fetch(`/api/sales/pay-due/${currentSale._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: payAmount })
        });

        const result = await res.json();

        if (res.ok) {
            alert("৳" + payAmount + " টাকা জমা নেওয়া হয়েছে।");
            closeModal('memoModal');
            closeModal('historyModal');
            fetchDueSales(); // বাকির খাতা রিফ্রেশ করা
        } else {
            alert("ভুল হয়েছে: " + result.msg);
        }
    } catch (err) {
        alert("সার্ভারে সমস্যা হচ্ছে!");
    }
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}