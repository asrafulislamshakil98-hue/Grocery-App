let allSales = []; // সব সেল ডাটা এখানে থাকবে
let currentMemoId = null;

document.addEventListener('DOMContentLoaded', fetchReports);

// ১. ডাটাবেজ থেকে রিপোর্ট নিয়ে আসা
async function fetchReports() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    let url = '/api/sales/report/all';
    if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    try {
        const response = await fetch(url);
        allSales = await response.json();
        renderReports(allSales);
    } catch (err) {
        console.error("রিপোর্ট লোড করতে সমস্যা:", err);
    }
}

// ২. টেবিলে ডাটা সাজানো
function renderReports(sales) {
    const tableBody = document.getElementById('reportTableBody');
    tableBody.innerHTML = '';

    if (sales.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">কোনো রেকর্ড পাওয়া যায়নি।</td></tr>';
        return;
    }

    sales.forEach((sale, index) => {
        const date = new Date(sale.date).toLocaleDateString('bn-BD');
        
        // আইটেমগুলোর নাম সংক্ষেপে দেখানো
        const itemShort = sale.items.map(i => i.name).join(', ').substring(0, 25) + "...";

        const row = document.createElement('tr');
        row.style.cursor = "pointer";
        // ইনডেক্স ব্যবহার করে মেমো ওপেন করা (যাতে এরর না হয়)
        row.setAttribute('onclick', `openInvoice(${index})`);

        row.innerHTML = `
            <td>${date}</td>
            <td><b>${sale.customerName}</b></td>
            <td style="font-size: 0.8rem; color: #666;">${itemShort}</td>
            <td>৳ ${sale.totalAmount}</td>
            <td>৳ ${sale.paidAmount}</td>
            <td><span class="badge ${sale.dueAmount > 0 ? 'bg-danger' : 'bg-success'}">৳ ${sale.dueAmount}</span></td>
            <td style="font-weight:bold; color:green;">৳ ${sale.profit || 0}</td>
        `;
        tableBody.appendChild(row);
    });
}

// ৩. ইনভয়েস/মেমো ওপেন করা
function openInvoice(index) {
    const sale = allSales[index]; 
    if (!sale) return;

    currentMemoId = sale._id;
    
    // কাস্টমার এবং তারিখ সেট করা
    document.getElementById('invCustomer').innerText = sale.customerName;
    document.getElementById('invDate').innerText = "রশিদ নং: " + sale._id.substring(18) + " | " + new Date(sale.date).toLocaleString('bn-BD');
    
    // মোট হিসাব সেট করা
    document.getElementById('invTotal').innerText = "৳ " + sale.totalAmount;
    document.getElementById('invPaid').innerText = "৳ " + sale.paidAmount;
    document.getElementById('invDue').innerText = "৳ " + sale.dueAmount;

    // আইটেম টেবিল ক্লিয়ার করে নতুন করে যোগ করা
    const itemsContainer = document.getElementById('invItems');
    itemsContainer.innerHTML = '';
    
    sale.items.forEach(item => {
        // এই লাইনের মোট দাম (দর × পরিমাণ)
        const rowTotal = item.price * item.quantity;

        itemsContainer.innerHTML += `
            <tr style="border-bottom: 1px solid #f9f9f9;">
                <td style="padding:10px 2px; font-size:0.7rem; color:#555;">${item.barcode || '---'}</td>
                <td style="padding:10px 2px; word-break: break-word;"><b>${item.name}</b></td>
                <!-- ৩ নম্বর কলাম: পরিমাণ (মাঝখানে) -->
                <td style="text-align:center; padding:10px 2px;">${item.quantity}</td>
                <!-- ৪ নম্বর কলাম: মোট দাম (সবার ডানে) -->
                <td style="text-align:right; padding:10px 2px; font-weight:bold;">৳ ${rowTotal}</td>
            </tr>
        `;
    });

    // মডালটি দেখানো
    document.getElementById('invoiceModal').style.display = 'flex';
}

// ৪. মডাল বন্ধ করা
function closeInvoice() {
    document.getElementById('invoiceModal').style.display = 'none';
}

// ৫. মেমো ডিলিট করা
async function deleteMemo() {
    if (confirm("আপনি কি নিশ্চিতভাবে এই মেমোটি ডিলিট করতে চান? এতে মাল স্টকে ফেরত যাবে।")) {
        try {
            const res = await fetch(`/api/sales/delete/${currentMemoId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                alert("মেমো ডিলিট সফল হয়েছে!");
                closeInvoice();
                fetchReports(); // আবার লিস্ট লোড করা
            } else {
                alert("ডিলিট করা যায়নি!");
            }
        } catch (err) {
            alert("সার্ভার এরর!");
        }
    }
}