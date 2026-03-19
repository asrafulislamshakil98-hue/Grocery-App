let allCompanies = [];

document.addEventListener('DOMContentLoaded', fetchCompanies);

async function fetchCompanies() {
    try {
        const res = await fetch('/api/companies/all');
        allCompanies = await res.json();
        showList('baki'); // ডিফল্টভাবে বাকির লিস্ট দেখাবে
    } catch (err) {
        console.error("Error fetching companies:", err);
    }
}

function showList(type) {
    const listContainer = document.getElementById('companyList');
    const bakiBtn = document.getElementById('bakiBtn');
    const cashBtn = document.getElementById('cashBtn');
    
    listContainer.innerHTML = '';

    // বাটন কালার পরিবর্তন
    if (type === 'baki') {
        bakiBtn.classList.add('active');
        cashBtn.classList.remove('active');
    } else {
        cashBtn.classList.add('active');
        bakiBtn.classList.remove('active');
    }

    // ফিল্টার করা (বাকি থাকলে Baki, না থাকলে Cash)
    const filtered = allCompanies.filter(c => {
        return type === 'baki' ? c.totalDue > 0 : c.totalDue === 0;
    });

    if (filtered.length === 0) {
        listContainer.innerHTML = `<p style="text-align:center; color:#999; margin-top:20px;">কোনো ${type === 'baki' ? 'বাকি' : 'ক্যাশ'} কোম্পানি পাওয়া যায়নি।</p>`;
        return;
    }

    filtered.forEach(c => {
        const card = `
            <div class="company-card" style="border-left-color: ${type === 'baki' ? '#e74c3c' : '#27ae60'}">
                <div class="info">
                    <b>${c.name}</b>
                    <div>মোবাইল: ${c.phone || 'নেই'}</div>
                </div>
                <div>
                    ${type === 'baki' ? 
                        `<span class="due-amount">৳ ${c.totalDue}</span>` : 
                        `<span class="cash-status"><i class="fa-solid fa-check-circle"></i> পরিশোধিত</span>`
                    }
                </div>
            </div>
        `;
        listContainer.innerHTML += card;
    });
}

let selectedCompanyId = null;

// showList ফাংশনটি আপডেট করুন যাতে রো ক্লিক করলে openCompanyDetails কল হয়
function showList(type) {
    const listContainer = document.getElementById('companyList');
    listContainer.innerHTML = '';

    const filtered = allCompanies.filter(c => type === 'baki' ? c.totalDue > 0 : c.totalDue === 0);

    filtered.forEach((c, index) => {
        // ক্লিক অপশন যোগ করা হয়েছে
        const card = document.createElement('div');
        card.className = 'company-card';
        card.style.cursor = 'pointer';
        card.style.borderLeftColor = type === 'baki' ? '#e74c3c' : '#27ae60';
        card.onclick = () => openCompanyDetails(c); 

        card.innerHTML = `
            <div class="info">
                <b>${c.name}</b>
                <div>মোবাইল: ${c.phone || 'নেই'}</div>
            </div>
            <div>
                ${type === 'baki' ? `<span class="due-amount">৳ ${c.totalDue}</span>` : `<span class="cash-status">পরিশোধিত</span>`}
            </div>
        `;
        listContainer.appendChild(card);
    });
}

// ১. কোম্পানির ওপর ক্লিক করলে তারিখের লিস্ট নিয়ে আসবে
async function openCompanyDetails(company) {
    selectedCompanyId = company._id;
    document.getElementById('detName').innerText = company.name;
    document.getElementById('detPhone').innerText = "মোবাইল: " + company.phone;
    document.getElementById('detDue').innerText = "৳ " + company.totalDue;

    // মডালের ভেতর তারিখের লিস্ট দেখানোর জন্য একটি জায়গা তৈরি করি
    const historyContainer = document.getElementById('detAddress'); 
    historyContainer.innerHTML = '<b>ক্রয় ইতিহাস (তারিখ অনুযায়ী):</b><br><br>';

    try {
        const res = await fetch(`/api/companies/purchases/${company._id}`);
        const purchases = await res.json();

        if (purchases.length === 0) {
            historyContainer.innerHTML += 'কোনো ক্রয়ের ইতিহাস পাওয়া যায়নি।';
        }

        purchases.forEach((p, index) => {
            const date = new Date(p.date).toLocaleString('bn-BD');
            const pBtn = document.createElement('div');
            pBtn.style = "padding:10px; background:#f1f1f1; margin-bottom:5px; border-radius:5px; cursor:pointer; font-size:0.9rem;";
            pBtn.innerHTML = `<i class="fa-solid fa-calendar-day"></i> ${date} - <b>৳${p.totalAmount}</b>`;
            
            // তারিখের ওপর ক্লিক করলে বিস্তারিত মেমো খুলবে
            pBtn.onclick = () => showPurchaseMemo(p);
            historyContainer.appendChild(pBtn);
        });

    } catch (err) {
        console.log("History load error");
    }

    document.getElementById('companyModal').style.display = 'flex';
}

// ২. নির্দিষ্ট তারিখের মেমো (Invoices) দেখানোর ফাংশন
function showPurchaseMemo(purchase) {
    // এটি একটি নতুন পপআপ বা অ্যালার্ট বা মডালের ভেতর সুন্দর করে দেখাবে
    let itemDetails = purchase.items.map(i => `${i.name} (${i.quantity} x ${i.purchasePrice})`).join('\n');
    alert(`কোম্পানি: ${purchase.companyName}\nতারিখ: ${new Date(purchase.date).toLocaleString()}\n--------------------\n${itemDetails}\n--------------------\nমোট: ৳${purchase.totalAmount}`);
}

function closeModal() {
    document.getElementById('companyModal').style.display = 'none';
}

// কোম্পানি ডিলিট করা
async function deleteCompany() {
    if (confirm("আপনি কি নিশ্চিতভাবে এই কোম্পানি ডিলিট করতে চান? এতে ওই কোম্পানির সব বকেয়া হিসাব মুছে যাবে।")) {
        try {
            const res = await fetch(`/api/companies/${selectedCompanyId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                alert("কোম্পানি ডিলিট সফল হয়েছে!");
                location.reload();
            }
        } catch (err) {
            alert("সার্ভার এরর!");
        }
    }
}

let currentPurchaseId = null;

// মেমো ওপেন করার ফাংশন (৫ কলাম)
function showPurchaseMemo(purchase) {
    currentPurchaseId = purchase._id;
    document.getElementById('pMemoCompanyName').innerText = purchase.companyName;
    document.getElementById('pMemoDate').innerText = "তারিখ: " + new Date(purchase.date).toLocaleString('bn-BD');
    document.getElementById('pMemoTotal').innerText = purchase.totalAmount;
    document.getElementById('pMemoStatus').innerText = "পেমেন্ট: " + (purchase.paymentType === 'cash' ? 'নগদ' : 'বাকি');
    document.getElementById('pMemoStatus').style.color = purchase.paymentType === 'cash' ? 'green' : 'red';

    const body = document.getElementById('pMemoBody');
    body.innerHTML = '';

    purchase.items.forEach(item => {
        body.innerHTML += `
            <tr style="border-bottom: 1px solid #f9f9f9;">
                <td style="padding:8px 0; font-size:0.75rem;">${item.barcode || '---'}</td>
                <td><b>${item.name}</b></td>
                <td style="text-align:center;">${item.quantity}</td>
                <td style="text-align:center;">${item.purchasePrice}</td>
                <td style="text-align:right;">${item.price}</td>
            </tr>
        `;
    });

    document.getElementById('purchaseMemoModal').style.display = 'flex';
}

function closePurchaseMemo() {
    document.getElementById('purchaseMemoModal').style.display = 'none';
}

// কোম্পানিকে টাকা পরিশোধ (Pay)
async function payToCompany() {
    const amount = prompt("কোম্পানিকে কত টাকা পরিশোধ করবেন?");
    if (amount && !isNaN(amount)) {
        const res = await fetch(`/api/companies/pay/${selectedCompanyId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: Number(amount) })
        });
        if (res.ok) {
            alert("পেমেন্ট সফল!");
            location.reload();
        }
    }
}

// ক্রয় মেমো ডিলিট করা (Delete)
async function deletePurchaseMemo() {
    if (confirm("সতর্কতা! এই মেমো ডিলিট করলে স্টক থেকে মাল কমে যাবে। ডিলিট করবেন?")) {
        const res = await fetch(`/api/companies/purchase/${currentPurchaseId}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            alert("মেমো ডিলিট সফল!");
            location.reload();
        }
    }
}