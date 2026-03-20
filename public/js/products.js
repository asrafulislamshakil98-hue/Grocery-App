let allProducts = [];
let purchaseCart = [];
let currentMode = 'cash';
let html5QrCode;

// ডাটা লোড করা
async function init() {
    const pRes = await fetch('/api/products/all');
    allProducts = await pRes.json();
    
    const cRes = await fetch('/api/companies/all');
    const companies = await cRes.json();
    const cSelect = document.getElementById('companySelect');
    companies.forEach(c => {
        cSelect.innerHTML += `<option value="${c._id}">${c.name}</option>`;
    });
}
init();

// সার্চ লজিক
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
        div.onclick = () => addToCart(p);
        suggestions.appendChild(div);
    });
    suggestions.style.display = 'block';
});

function addToCart(p) {
    const qty = parseInt(document.getElementById('qtyInput').value) || 1;
    const existing = purchaseCart.find(item => item.productId === p._id);
    
    if(existing) {
        existing.quantity += qty;
    } else {
        purchaseCart.push({
            productId: p._id,
            barcode: p.barcode || '---',
            name: p.name,
            purchasePrice: p.purchasePrice || 0,
            price: p.price || 0,
            quantity: qty
        });
    }
    
    barcodeInput.value = '';
    document.getElementById('qtyInput').value = 1;
    suggestions.style.display = 'none';
    renderTable();
}

function renderTable() {
    const body = document.getElementById('purchaseBody');
    const grandTotal = document.getElementById('grandTotal');
    body.innerHTML = '';
    let total = 0;

    purchaseCart.forEach((item, index) => {
        const subTotal = item.purchasePrice * item.quantity;
        total += subTotal;
        body.innerHTML += `
            <tr>
                <td>
                    <b>${item.name}</b><br>
                    <small style="color:#888; font-size:0.7rem;">${item.barcode}</small>
                </td>
                <td style="text-align:center;"><input type="number" class="table-input" value="${item.purchasePrice}" onchange="updateItem(${index}, 'purchasePrice', this.value)"></td>
                <td style="text-align:center;"><input type="number" class="table-input" value="${item.price}" onchange="updateItem(${index}, 'price', this.value)"></td>
                <td style="text-align:center;"><input type="number" class="table-input" value="${item.quantity}" onchange="updateItem(${index}, 'quantity', this.value)"></td>
            </tr>
        `;
    });
    grandTotal.innerText = `৳ ${total}`;
}
function updateItem(index, field, value) {
    purchaseCart[index][field] = parseFloat(value);
    renderTable();
}

function setMode(mode) {
    currentMode = mode;
    document.getElementById('cashBtn').classList.toggle('active', mode === 'cash');
    document.getElementById('creditBtn').classList.toggle('active', mode === 'credit');
}

// সেভ করা
async function savePurchase() {
    const companyId = document.getElementById('companySelect').value;
    if(!companyId) return alert("কোম্পানি সিলেক্ট করুন!");
    if(purchaseCart.length === 0) return alert("লিস্ট খালি!");

    const res = await fetch('/api/products/bulk-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, items: purchaseCart, paymentType: currentMode })
    });

    if(res.ok) {
        alert("স্টক আপডেট সফল হয়েছে!");
        location.reload();
    }
}

// ক্যামেরা স্ক্যানার (আগের মতো)
function openScanner() {
    document.getElementById('scanner-modal').style.display = 'flex';
    html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (text) => {
        const p = allProducts.find(prod => prod.barcode === text);
        if(p) { addToCart(p); closeScanner(); }
    });
}
function closeScanner() {
    html5QrCode.stop().then(() => document.getElementById('scanner-modal').style.display = 'none');
}