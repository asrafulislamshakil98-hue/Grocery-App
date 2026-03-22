let allProducts = [];
let cart = [];
let currentMode = 'cash';
let html5QrCode;

// ডাটা লোড করা
async function init() {
    const pRes = await fetch('/api/products/all');
    allProducts = await pRes.json();
    
    const cRes = await fetch('/api/customers/all');
    const customers = await cRes.json();
    const cSelect = document.getElementById('customerSelect');
    cSelect.innerHTML = '<option value="">কাস্টমার বেছে নিন</option>';
    customers.forEach(c => {
        cSelect.innerHTML += `<option value="${c._id}">${c.name} (${c.phone})</option>`;
    });
}
init();

// কাস্টমার সিলেক্ট করলে আগের বাকি লোড করার লজিক
// এটি আপনার js/pos.js এর ভেতর নিশ্চিত করুন
const customerSelectEl = document.getElementById('customerSelect');

if (customerSelectEl) {
    customerSelectEl.addEventListener('change', async function() {
        const id = this.value;
        const dueBox = document.getElementById('prevDueBox');
        const dueAmountDisplay = document.getElementById('prevDueAmount');

        if (id) {
            console.log("Fetching due for customer:", id);
            try {
                // রেন্ডারে কাজ করার জন্য রিলেটিভ পাথ ব্যবহার করুন
                const res = await fetch('/api/customers/' + id);
                if (!res.ok) throw new Error("Customer not found");
                
                const customer = await res.json();
                dueAmountDisplay.innerText = `৳ ${customer.totalDue || 0}`;
                dueBox.style.display = 'block';
            } catch (err) {
                console.error("Fetch error on Render:", err);
                dueBox.style.display = 'none';
            }
        } else {
            dueBox.style.display = 'none';
        }
    });
}
// --- ক্যামেরা স্ক্যানার লজিক ---
function openScanner() {
    document.getElementById('scanner-modal').style.display = 'flex';
    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 150 } };

    html5QrCode.start({ facingMode: "environment" }, config, (decodedText) => {
        // বারকোড পেলে সেটি ইনপুটে বসিয়ে সার্চ করা হবে
        document.getElementById('barcodeInput').value = decodedText;
        searchAndAdd(decodedText);
        closeScanner();
    });
}

function closeScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('scanner-modal').style.display = 'none';
        });
    } else {
        document.getElementById('scanner-modal').style.display = 'none';
    }
}

// নাম বা বারকোড দিয়ে মাল যোগ করা
function searchAndAdd(term) {
    const product = allProducts.find(p => p.barcode === term);
    if (product) {
        addProductToCart(product);
    }
}

// ইনপুট হ্যান্ডলিং
const barcodeInput = document.getElementById('barcodeInput');
const suggestions = document.getElementById('suggestions');

barcodeInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    if(term.length < 1) { suggestions.style.display = 'none'; return; }

    const filtered = allProducts.filter(p => 
        (p.barcode && p.barcode.includes(term)) || p.name.toLowerCase().includes(term)
    );

    suggestions.innerHTML = '';
    filtered.forEach(p => {
        const div = document.createElement('div');
        div.className = 'sug-item';
        div.innerHTML = `<span>${p.name}</span> <small>(স্টক: ${p.stock})</small>`;
        div.onclick = () => addProductToCart(p);
        suggestions.appendChild(div);
    });
    suggestions.style.display = 'block';

    const exactMatch = allProducts.find(p => p.barcode === term);
    if(exactMatch) addProductToCart(exactMatch);
});

// কার্টে মাল যোগ করা
function addProductToCart(p) {
    const qty = parseInt(document.getElementById('qtyInput').value) || 1;
    if(p.stock < qty) { alert("স্টক নেই!"); return; }

    const existing = cart.find(item => item.productId === p._id);
    if(existing) {
        existing.quantity += qty;
    } else {
        cart.push({
            productId: p._id,
            barcode: p.barcode || '---',
            name: p.name,
            quantity: qty,
            price: p.price
        });
    }
    
    barcodeInput.value = '';
    document.getElementById('qtyInput').value = 1;
    suggestions.style.display = 'none';
    barcodeInput.focus();
    renderInvoice();
}

function renderInvoice() {
    const body = document.getElementById('invoiceBody');
    const grandTotal = document.getElementById('grandTotal');
    body.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const subTotal = item.price * item.quantity;
        total += subTotal;
        body.innerHTML += `
            <tr onclick="removeFromCart(${index})" style="cursor:pointer">
                <td>${item.barcode}</td>
                <td><b>${item.name}</b></td>
                <td>${item.quantity}</td>
                <td style="text-align:right">৳ ${subTotal}</td>
            </tr>
        `;
    });
    grandTotal.innerText = `৳ ${total}`;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderInvoice();
}

function setMode(mode) {
    currentMode = mode;
    document.getElementById('cashBtn').classList.toggle('active', mode === 'cash');
    document.getElementById('creditBtn').classList.toggle('active', mode === 'credit');
    document.getElementById('customerBox').style.display = mode === 'credit' ? 'block' : 'none';
}

let finalTotal = 0;
let finalNetBill = 0;

// ১. পপআপ ওপেন করার ফাংশন
function processSale() {
    if (cart.length === 0) return alert("কার্ট খালি!");
    
    finalTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    document.getElementById('modalTotal').innerText = `৳ ${finalTotal}`;
    document.getElementById('discountInput').value = 0;
    document.getElementById('modalPaidInput').value = (currentMode === 'cash') ? finalTotal : 0;
    
    // ক্রেডিট মোড হলে টেক্সট পরিবর্তন
    if(currentMode === 'credit') {
        document.getElementById('paidLabel').innerText = "কাস্টমার কত জমা দিলো?";
        document.getElementById('returnText').innerText = "বাকি থাকবে";
    } else {
        document.getElementById('paidLabel').innerText = "কাস্টমার কত টাকা দিলো?";
        document.getElementById('returnText').innerText = "কাস্টমার ফেরত পাবে";
    }

    calculateFinal();
    document.getElementById('checkoutModal').style.display = 'flex';
}

// ২. ক্যালকুলেশন (ডিসকাউন্ট ও ফেরত টাকা)
function calculateFinal() {
    const discount = parseFloat(document.getElementById('discountInput').value) || 0;
    const paid = parseFloat(document.getElementById('modalPaidInput').value) || 0;
    
    finalNetBill = finalTotal - discount;
    document.getElementById('netBill').innerText = `৳ ${finalNetBill}`;
    
    let diff = paid - finalNetBill;

    if (currentMode === 'credit') {
        // বাকি মোডে: বিল - জমা = বকেয়া
        let due = finalNetBill - paid;
        document.getElementById('modalChangeAmount').innerText = `৳ ${due > 0 ? due : 0}`;
        document.getElementById('modalChangeAmount').style.color = "#d63031"; // লাল রঙ
    } else {
        // ক্যাশ মোডে: জমা - বিল = কাস্টমার ফেরত পাবে
        document.getElementById('modalChangeAmount').innerText = `৳ ${diff > 0 ? diff : 0}`;
        document.getElementById('modalChangeAmount').style.color = "#e67e22"; // কমলা রঙ
    }
}

function closeCheckout() {
    document.getElementById('checkoutModal').style.display = 'none';
}

// ৩. ফাইনাল সেভ করা
async function submitFinalSale() {
    // ১. ইনপুট থেকে ডাটা সংগ্রহ করা
    let paid = parseFloat(document.getElementById('modalPaidInput').value) || 0;
    const discount = parseFloat(document.getElementById('discountInput').value) || 0;

    let customerName = "Cash Customer";
    let customerId = null;

    // ২. কাস্টমার ইনফো এবং আইডি চেক করা
    if (currentMode === 'credit') {
        const cSelect = document.getElementById('customerSelect');
        if (!cSelect.value) {
            alert("বাকি বিক্রির জন্য কাস্টমার সিলেক্ট করুন!");
            return;
        }
        customerId = cSelect.value; // ডাটাবেজে কাস্টমার একাউন্ট আপডেটের জন্য আইডি নেওয়া হলো
        customerName = cSelect.options[cSelect.selectedIndex].text;
    }

    // ৩. খুচরা ফেরত লজিক (যাতে আজকের বাকি মাইনাস না হয়)
    // ক্যাশ মোডে কাস্টমার বেশি টাকা দিলেও ডাটাবেজে শুধু বিলের সমপরিমাণ জমা দেখাবে
    let actualPaidInDb = paid;
    if (currentMode === 'cash' && paid > finalNetBill) {
        actualPaidInDb = finalNetBill;
    }

    // ৪. ফাইনাল ডাটা অবজেক্ট তৈরি
    const finalData = {
        customerId: customerId, // কাস্টমার আইডি পাঠানো হচ্ছে
        customerName: customerName,
        items: cart,
        totalAmount: finalNetBill,
        paidAmount: actualPaidInDb,
        discount: discount
    };

    // ৫. বাটন কন্ট্রোল (যাতে ইউজার বারবার ক্লিক করতে না পারে)
    const btn = document.getElementById('finalBtn');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "কাজ চলছে...";

    // ৬. সার্ভারে ডাটা পাঠানো
    try {
        const res = await fetch('/api/sales/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalData)
        });

        const result = await res.json();

        if (res.ok) {
            alert("বিক্রি সফল হয়েছে!");
            location.reload(); // পেজ রিফ্রেশ
        } else {
            // সার্ভার থেকে আসা ভুল মেসেজ দেখানো
            alert("ভুল হয়েছে: " + (result.msg || "বিক্রি সম্পন্ন করা যায়নি।"));
            btn.disabled = false;
            btn.innerText = originalText;
        }
    } catch (error) {
        console.error("Error:", error);
        alert("সার্ভারে সমস্যা হচ্ছে! ইন্টারনেট বা নোড জেএস টার্মিনাল চেক করুন।");
        btn.disabled = false;
        btn.innerText = originalText;
    }
}