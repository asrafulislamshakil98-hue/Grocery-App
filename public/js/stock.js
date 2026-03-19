document.addEventListener('DOMContentLoaded', fetchStock);

async function fetchStock() {
    try {
        const response = await fetch('/api/products/all');
        const products = await response.json();
        renderTable(products);
    } catch (err) {
        console.error("Error fetching stock:", err);
    }
}

function renderTable(products) {
    const tableBody = document.getElementById('stockTableBody');
    tableBody.innerHTML = '';

    products.forEach(product => {
        let stockClass = product.stock <= 0 ? 'out-of-stock' : (product.stock < 5 ? 'low-stock' : 'good-stock');
        let stockText = product.stock <= 0 ? 'শেষ' : (product.stock < 5 ? `অল্প (${product.stock})` : `${product.stock} টি`);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${product.image || 'https://via.placeholder.com/50'}" class="product-img"></td>
            <td><b>${product.name}</b><br><small>${product.category || 'General'}</small></td>
            <td>
                <span class="buy-price">ক্রয়: ৳${product.purchasePrice || 0}</span><br>
                <span class="price-tag">বিক্রয়: ৳${product.price}</span>
            </td>
            <td><span class="stock-badge ${stockClass}">${stockText}</span></td>
            <td>
                <i class="fa-solid fa-pen-to-square" style="color:#2980b9; cursor:pointer; margin-right:15px; font-size:1.2rem;" 
                   onclick="openEdit('${product._id}', '${product.name}', ${product.purchasePrice || 0}, ${product.price}, ${product.stock})"></i>
                
                <i class="fa-solid fa-trash" style="color:#e74c3c; cursor:pointer; font-size:1.2rem;" 
                   onclick="deleteProduct('${product._id}')"></i>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// ডিলিট করার ফাংশন (URL ঠিক করা হয়েছে)
async function deleteProduct(id) {
    if (!id) return alert("আইডি পাওয়া যায়নি!");
    
    if (confirm("আপনি কি নিশ্চিতভাবে এই পণ্যটি মুছে ফেলতে চান?")) {
        try {
            // নিশ্চিত হোন এখানে /api/products/ আছে
            const res = await fetch('/api/products/' + id, {
                method: 'DELETE'
            });

            const result = await res.json();
            if (res.ok) {
                alert(result.msg);
                fetchStock(); 
            } else {
                alert("ভুল: " + result.msg);
            }
        } catch (err) {
            console.error("Delete Error:", err);
            alert("সার্ভারে কানেক্ট করা যাচ্ছে না!");
        }
    }
}

function openEdit(id, name, purchase, price, stock) {
    document.getElementById('editId').value = id;
    document.getElementById('editName').value = name;
    document.getElementById('editPurchase').value = purchase;
    document.getElementById('editPrice').value = price;
    document.getElementById('editStock').value = stock;
    document.getElementById('editModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

// এডিট সেভ করার ফাংশন (URL ঠিক করা হয়েছে)
async function saveEdit() {
    const id = document.getElementById('editId').value;
    const data = {
        name: document.getElementById('editName').value,
        purchasePrice: Number(document.getElementById('editPurchase').value),
        price: Number(document.getElementById('editPrice').value),
        stock: Number(document.getElementById('editStock').value)
    };

    try {
        // নিশ্চিত হোন এখানে /api/products/ আছে
        const res = await fetch('/api/products/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert("সফলভাবে আপডেট হয়েছে!");
            closeModal();
            fetchStock();
        } else {
            alert("আপডেট ব্যর্থ হয়েছে!");
        }
    } catch (err) {
        console.error("Edit Error:", err);
        alert("সার্ভার এরর!");
    }
}