// ১. পেজ লোড হওয়ার পর সব কাজ শুরু হবে
document.addEventListener('DOMContentLoaded', () => {
    fetchUserInfo();      // ইউজারের তথ্য ও লোগো লোড করা
    loadDashboardStats(); // ড্যাশবোর্ড রিপোর্ট লোড করা
    
    // যদি এই পেজে পণ্য দেখানোর টেবিল থাকে (যেমন products.html এ ব্যবহার করলে)
    const productList = document.getElementById('productList');
    if (productList) fetchProducts();
});

// ২. বর্তমান ইউজারের প্রোফাইল ডাটা লোড করা (বাম পাশের লোগো ও নাম সেট করা)
async function fetchUserInfo() {
    try {
        const res = await fetch('/api/auth/current-user');
        if (res.status === 401) {
            window.location.href = 'login.html'; // লগইন না থাকলে লগইন পেজে পাঠাবে
            return;
        }
        const user = await res.json();

        // দোকানের নাম বসানো (বাম পাশে)
        if (document.getElementById('displayShopName')) {
            document.getElementById('displayShopName').innerText = user.shopName || "আমার মুদি দোকান";
        }
        
        // ইউজার নেম বসানো (ড্রপডাউনে)
        if (document.getElementById('userNameDisplay')) {
            document.getElementById('userNameDisplay').innerText = "ইউজার: " + user.username;
        }

        // দোকানের লোগো হ্যান্ডলিং (বাম পাশে ও প্রোফাইল আইকনে)
        if (user.shopLogo) {
            // মেইন লোগো (বাম পাশ)
            const mainLogo = document.getElementById('mainShopLogo');
            if (mainLogo) {
                mainLogo.src = user.shopLogo;
                mainLogo.style.display = 'block';
                if (document.getElementById('defaultShopIcon')) {
                    document.getElementById('defaultShopIcon').style.display = 'none';
                }
            }

            // প্রোফাইল আইকন (ডান পাশ)
            const profilePic = document.getElementById('userProfilePic');
            if (profilePic) {
                profilePic.src = user.shopLogo;
                profilePic.style.display = 'block';
                if (document.getElementById('userDefaultIcon')) {
                    document.getElementById('userDefaultIcon').style.display = 'none';
                }
            }
        }

        // এডিট ফরমে আগের ডাটা বসানো
        if (document.getElementById('editShopName')) {
            document.getElementById('editShopName').value = user.shopName || "";
            document.getElementById('editShopAddress').value = user.address || "";
        }

        // রোল চেক (অ্যাডমিন না স্টাফ?)
        if (user.role === 'staff') {
            const adminOnlyElements = document.querySelectorAll('.btn-profit, .btn-report');
            adminOnlyElements.forEach(el => el.style.display = 'none');
        }

    } catch (err) {
        console.error("UserInfo load error:", err);
    }
}

// ৩. ড্যাশবোর্ড সামারি রিপোর্ট লোড করা
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/sales/dashboard-stats');
        const data = await response.json();

        // আইডি চেক করে ডাটা বসানো (সব পেজে এই আইডি থাকে না তাই check করা জরুরি)
        if (document.getElementById('totalSales')) document.getElementById('totalSales').innerText = `${data.totalSales || 0} টাকা`;
        if (document.getElementById('totalCash')) document.getElementById('totalCash').innerText = `${data.totalCash || 0} টাকা`;
        if (document.getElementById('totalDue')) document.getElementById('totalDue').innerText = `${data.totalDue || 0} টাকা`;
        if (document.getElementById('totalProfit')) document.getElementById('totalProfit').innerText = `৳ ${data.totalProfit || 0}`;
        
        if (document.getElementById('lowStock')) {
            const lowStockEl = document.getElementById('lowStock');
            lowStockEl.innerText = `${data.lowStockCount || 0} টি`;
            if (data.lowStockCount > 0) lowStockEl.style.color = 'red';
        }
    } catch (error) {
        console.error('Stats loading error:', error);
    }
}

// ৪. প্রোফাইল আপডেট সাবমিট করা
const profileForm = document.getElementById('profileForm');
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('profileSaveBtn');
        saveBtn.innerText = "আপডেট হচ্ছে...";
        saveBtn.disabled = true;

        const formData = new FormData();
        formData.append('shopName', document.getElementById('editShopName').value);
        formData.append('address', document.getElementById('editShopAddress').value);
        
        const logoFile = document.getElementById('editShopLogo').files[0];
        if (logoFile) {
            formData.append('logo', logoFile);
        }

        try {
            const res = await fetch('/api/auth/update-profile', {
                method: 'PUT',
                body: formData
            });

            if (res.ok) {
                alert("দোকান প্রোফাইল সফলভাবে আপডেট হয়েছে!");
                location.reload();
            } else {
                alert("আপডেট ব্যর্থ হয়েছে!");
            }
        } catch (err) {
            alert("সার্ভার এরর!");
        } finally {
            saveBtn.innerText = "আপডেট করুন";
            saveBtn.disabled = false;
        }
    });
}

// ৫. লগআউট ড্রপডাউন টগল করা
function toggleLogoutMenu() {
    const dropdown = document.getElementById('logoutDropdown');
    if (dropdown) {
        dropdown.style.display = (dropdown.style.display === 'none' || dropdown.style.display === '') ? 'block' : 'none';
    }
}

// ৬. প্রোফাইল মডাল ওপেন ও ক্লোজ
function openProfileModal() {
    document.getElementById('profileModal').style.display = 'flex';
    document.getElementById('logoutDropdown').style.display = 'none';
}

function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
}

// ৭. ড্রপডাউনের বাইরে ক্লিক করলে বন্ধ করা
window.addEventListener('click', function(e) {
    const dropdown = document.getElementById('logoutDropdown');
    const userLogo = document.getElementById('userLogo');
    if (dropdown && userLogo && !userLogo.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

// প্রোফাইল আপডেট সাবমিট করার ফাংশন
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const saveBtn = document.getElementById('profileSaveBtn');
    saveBtn.innerText = "আপলোড হচ্ছে...";
    saveBtn.disabled = true;

    // ১. টেক্সট এবং ফাইল পাঠানোর জন্য FormData তৈরি
    const formData = new FormData();
    formData.append('shopName', document.getElementById('editShopName').value);
    formData.append('address', document.getElementById('editShopAddress').value);
    
    // ছবি ফাইলটি নেওয়া
    const logoFile = document.getElementById('editShopLogo').files[0];
    if (logoFile) {
        formData.append('logo', logoFile); // 'logo' নামি ব্যাকএন্ডে রিসিভ হবে
    }

    try {
        const res = await fetch('/api/auth/update-profile', {
            method: 'PUT',
            body: formData // হেডার দেওয়ার দরকার নেই, ব্রাউজার নিজে সেট করবে
        });

        if (res.ok) {
            alert("দোকানের লোগো ও তথ্য আপডেট হয়েছে!");
            location.reload(); // পেজ রিফ্রেশ করলে নতুন লোগো দেখা যাবে
        } else {
            alert("আপডেট ব্যর্থ হয়েছে!");
        }
    } catch (err) {
        console.error(err);
        alert("সার্ভার এরর!");
    } finally {
        saveBtn.innerText = "আপডেট করুন";
        saveBtn.disabled = false;
    }
}

// সেটিংস ওপেন/ক্লোজ
function openSettingsMenu() {
    document.getElementById('settingsModal').style.display = 'flex';
    document.getElementById('logoutDropdown').style.display = 'none';
}
function closeSettingsMenu() {
    document.getElementById('settingsModal').style.display = 'none';
}

// ১. প্রাইভেসি পলিসি
function showPrivacy() {
    alert("প্রাইভেসি পলিসি:\n১. আপনার ডাটা সম্পূর্ণ নিরাপদ।\n২. আমরা কোনো তথ্য তৃতীয় পক্ষের কাছে শেয়ার করি না।\n৩. আপনার পাসওয়ার্ড এনক্রিপ্টেড অবস্থায় থাকে।");
}

// ২. ইউজার পরিবর্তন মডাল
function openUserChange() {
    document.getElementById('actionTitle').innerText = "নতুন ইউজার নেম দিন";
    document.getElementById('actionFields').innerHTML = `<input type="text" id="newUsername" placeholder="নতুন নাম লিখুন" style="width:100%; padding:10px; box-sizing:border-box;">`;
    document.getElementById('actionModal').style.display = 'flex';
    
    document.getElementById('actionSaveBtn').onclick = async () => {
        const newName = document.getElementById('newUsername').value;
        const res = await fetch('/api/auth/update-username', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username: newName })
        });
        if(res.ok) { alert("ইউজার নেম আপডেট হয়েছে!"); location.reload(); }
        else alert("নামটি অন্য কেউ ব্যবহার করছে!");
    };
}

// ৩. পাসওয়ার্ড পরিবর্তন মডাল
function openPassChange() {
    document.getElementById('actionTitle').innerText = "পাসওয়ার্ড পরিবর্তন";
    document.getElementById('actionFields').innerHTML = `
        <input type="password" id="oldPass" placeholder="পুরানো পাসওয়ার্ড" style="width:100%; padding:10px; margin-bottom:10px; box-sizing:border-box;">
        <input type="password" id="newPass" placeholder="নতুন পাসওয়ার্ড" style="width:100%; padding:10px; box-sizing:border-box;">
    `;
    document.getElementById('actionModal').style.display = 'flex';

    document.getElementById('actionSaveBtn').onclick = async () => {
        const data = { 
            oldPassword: document.getElementById('oldPass').value, 
            newPassword: document.getElementById('newPass').value 
        };
        const res = await fetch('/api/auth/change-password', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await res.json();
        alert(result.msg);
        if(res.ok) location.reload();
    };
}

function closeActionModal() { document.getElementById('actionModal').style.display = 'none'; }