let html5QrCode;

// পেজ লোড হলে কোম্পানি লিস্ট আনা
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/companies/all');
        const companies = await res.json();
        const select = document.getElementById('companySelect');
        companies.forEach(c => {
            select.innerHTML += `<option value="${c._id}">${c.name}</option>`;
        });
    } catch (err) {
        console.error("কোম্পানি লোড করতে সমস্যা:", err);
    }
});

// --- ক্যামেরা স্ক্যানার ফাংশন ---
function openScanner() {
    document.getElementById('scanner-modal').style.display = 'flex';
    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 150 } };

    html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        (decodedText) => {
            // বারকোড রিড করতে পারলে সেটি ইনপুটে বসাবে
            document.getElementById('barcode').value = decodedText;
            closeScanner();
            // বারকোড পাওয়ার পর অটোমেটিক নাম বক্সে ফোকাস করবে
            document.getElementById('name').focus();
        },
        (errorMessage) => {
            // স্ক্যানিং চলাকালীন এরর (ইগনোর করা যায়)
        }
    ).catch((err) => {
        alert("ক্যামেরা ওপেন করা যাচ্ছে না!");
        console.error(err);
    });
}

function closeScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('scanner-modal').style.display = 'none';
        }).catch(err => {
            document.getElementById('scanner-modal').style.display = 'none';
        });
    } else {
        document.getElementById('scanner-modal').style.display = 'none';
    }
}

// --- ফরম সাবমিট লজিক ---
document.getElementById('prodRegForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> সেভ হচ্ছে...';
    saveBtn.disabled = true;

    // ডাটা সংগ্রহ করার জন্য FormData তৈরি
    const formData = new FormData();
    formData.append('barcode', document.getElementById('barcode').value);
    formData.append('name', document.getElementById('name').value);
    formData.append('companyId', document.getElementById('companySelect').value);
    formData.append('purchasePrice', document.getElementById('purchasePrice').value);
    formData.append('price', document.getElementById('price').value);
    formData.append('stock', document.getElementById('stock').value);
    formData.append('paymentType', document.getElementById('paymentType').value);
    
    // ছবি ফাইলটি যোগ করা
    const imageFile = document.getElementById('productImage').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        const response = await fetch('/api/products/add', {
            method: 'POST',
            // মনে রাখবেন: FormData পাঠালে 'Content-Type' হেডার দেওয়ার দরকার নেই, ব্রাউজার নিজে থেকেই দিয়ে দিবে
            body: formData
        });

        if (response.ok) {
            alert('পণ্য ও ছবি সফলভাবে সেভ হয়েছে!');
            location.reload();
        } else {
            alert('ভুল হয়েছে! আবার চেষ্টা করুন।');
        }
    } catch (err) {
        alert('সার্ভারে সমস্যা হচ্ছে!');
    } finally {
        saveBtn.innerHTML = 'পণ্য সেভ করুন';
        saveBtn.disabled = false;
    }
});