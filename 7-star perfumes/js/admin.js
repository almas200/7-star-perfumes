// Admin Panel Logic — Seven Star Perfume (v2 Stable Elite)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

// --- CONFIGURATION ---
const PRIMARY_OWNER = 'almasmansuri2004@gmail.com';
const firebaseConfig = {
    apiKey: "AIzaSyCnblcEAej7j64BG1JkIlU4p31dX-U6nvE",
    authDomain: "seven-star-perfume.firebaseapp.com",
    projectId: "seven-star-perfume",
    storageBucket: "seven-star-perfume.firebasestorage.app",
    messagingSenderId: "1095381170216",
    appId: "1:1095381170216:web:3cb1fb6d46719458e55d1d"
};
const IMGBB_API_KEY = "5d0286dde4941b79ea99e52afbd0e420";

console.log("Admin System: Initializing Elite Core...");
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

window.ADMIN_INIT = true; 

// --- STATE ---
let authorizedEmails = [];
let allProducts = [];
let allBrands = [];
let editingId = null;

// --- UI INITIALIZATION ---
function init() {
    console.log("Admin System: Binding Components...");
    
    document.addEventListener('click', async (e) => {
        const id = e.target.id || (e.target.closest('button') ? e.target.closest('button').id : null);
        
        if (id === 'login-btn') handleManualLogin();
        if (id === 'google-login-btn' || e.target.closest('#google-login-btn')) handleGoogleLogin();
        if (id === 'logout-btn' || e.target.closest('#logout-btn')) signOut(auth);
        
        if (id === 'add-product-btn') {
            editingId = null;
            document.getElementById('product-form').reset();
            document.getElementById('size-rows-container').innerHTML = '';
            document.getElementById('modal-title').textContent = 'Add New Product';
            // Reset image zone
            const preview = document.getElementById('img-preview');
            const placeholder = document.getElementById('img-upload-placeholder');
            const zone = document.getElementById('img-upload-zone');
            if(preview) { preview.style.display = 'none'; preview.src = ''; }
            if(placeholder) placeholder.style.display = 'block';
            if(zone) zone.classList.remove('has-image');
            document.getElementById('admin-product-modal').classList.add('active');
            initImageZone();
        }
        if (id === 'close-modal-btn') {
            document.getElementById('admin-product-modal').classList.remove('active');
        }
        if (id === 'add-size-row') addSizeRow();
        if (id === 'save-brand-btn') handleAddBrand();
        if (id === 'save-settings-btn') handleSaveSettings();
        if (id === 'save-admin-access-btn') handleSaveAdminAccess();
        if (id === 'run-bulk-btn') handleBulkUpload();
    });

    // Tab Nav
    document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
            item.classList.add('active');
            document.getElementById(item.dataset.tab).classList.add('active');
        });
    });

    // Form Submit
    const pForm = document.getElementById('product-form');
    if(pForm) pForm.addEventListener('submit', handleProductSubmit);

    // Category Change Sync
    const catSel = document.getElementById('p-cat');
    if(catSel) catSel.addEventListener('change', (e) => updateTypeOptions(e.target.value));

    // Image Upload Auto-Trigger
    const imgInput = document.getElementById('p-img-file');
    if(imgInput) imgInput.addEventListener('change', handleImageUpload);
}

// --- AUTH WATCHER ---
onAuthStateChanged(auth, async (user) => {
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('dashboard');

    if (user) {
        try {
            const adminSnap = await getDoc(doc(db, 'settings', 'admins'));
            if (adminSnap.exists()) {
                const data = adminSnap.data();
                authorizedEmails = data.emails || [];
            }
        } catch (e) { console.warn("Sync error:", e.message); }

        const email = user.email.toLowerCase();
        const isOwner = email === PRIMARY_OWNER.toLowerCase();
        const isAuthorizedStaff = authorizedEmails.some(e => e.toLowerCase() === email);

        if (isOwner || isAuthorizedStaff) {
            loginScreen.style.display = 'none';
            dashboard.style.display = 'block';
            setAdminUserBadge(user);
            loadAll();
            const securityTab = document.querySelector('.nav-item[data-tab="tab-settings"]');
            if(securityTab) securityTab.style.display = isOwner ? 'flex' : 'none';
        } else {
            alert("Entry Denied: " + email);
            await signOut(auth);
        }
    } else {
        loginScreen.style.display = 'flex';
        dashboard.style.display = 'none';
    }
});

// --- LOGIN HANDLERS ---
async function handleManualLogin() {
    const e = document.getElementById('email').value.trim();
    const p = document.getElementById('password').value;
    const btn = document.getElementById('login-btn');
    const err = document.getElementById('login-error');
    if (!e || !p) return;
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line rotate-center"></i> SECURITY CHECK...';
    try {
        await signInWithEmailAndPassword(auth, e, p);
    } catch (error) {
        err.style.display = 'block';
        err.textContent = "Access Denied.";
        setTimeout(() => err.style.display = 'none', 5000);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Secure Login';
    }
}

function setAdminUserBadge(user) {
    const badge = document.getElementById('admin-user-badge');
    const avatar = document.getElementById('admin-user-avatar');
    const nameEl = document.getElementById('admin-user-name');
    const emailEl = document.getElementById('admin-user-email');
    if (!badge || !avatar || !nameEl || !emailEl || !user) return;

    const email = user.email || 'Admin';
    const name = user.displayName || email.split('@')[0];
    const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0].toUpperCase())
        .join('') || 'AD';

    avatar.textContent = initials;
    nameEl.textContent = name;
    emailEl.textContent = email;
    badge.style.display = 'flex';
}

async function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
        await signInWithPopup(auth, provider);
    } catch (e) { alert("Google Access Interrupted."); }
}

// --- IMAGE UPLOAD (ImgBB) with Live Preview ---
async function handleImageUpload(e) {
    const file = e.target.files[0];
    if(!file) return;
    
    const pathInput = document.getElementById('p-img-path');
    const zone = document.getElementById('img-upload-zone');
    const preview = document.getElementById('img-preview');
    const placeholder = document.getElementById('img-upload-placeholder');
    const progress = document.getElementById('img-upload-progress');
    
    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    preview.src = localUrl;
    preview.style.display = 'block';
    placeholder.style.display = 'none';
    progress.style.display = 'flex';
    zone.classList.add('has-image');
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if(data.success) {
            pathInput.value = data.data.url;
            preview.src = data.data.url;
            showToast('✅ Image Uploaded Successfully!');
        } else throw new Error('Upload Failed');
    } catch (err) {
        showToast('Image Upload Failed — Check API Key', 'error');
        preview.src = localUrl; // Keep local preview
    } finally {
        progress.style.display = 'none';
    }
}

// Setup drag-drop for upload zone
function initImageZone() {
    const zone = document.getElementById('img-upload-zone');
    if(!zone) return;
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if(file && file.type.startsWith('image/')) {
            const input = document.getElementById('p-img-file');
            const dt = new DataTransfer();
            dt.items.add(file);
            input.files = dt.files;
            handleImageUpload({ target: input });
        }
    });
}

// --- RESOURCE LOADING ---
async function loadAll() {
    const [pSnap, bSnap, sSnap, aSnap] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'brands')),
        getDoc(doc(db, 'settings', 'shop')),
        getDoc(doc(db, 'settings', 'admins'))
    ]);
    allProducts = []; pSnap.forEach(d => allProducts.push({id: d.id, ...d.data()}));
    allBrands = []; bSnap.forEach(d => allBrands.push({id: d.id, ...d.data()}));
    if(sSnap.exists()) {
        const d = sSnap.data();
        document.getElementById('set-wa').value = d.whatsapp || '';
        document.getElementById('set-insta').value = d.instagram || '';
    }
    if(aSnap.exists()) {
        document.getElementById('set-admin-emails').value = (aSnap.data().emails || []).join(', ');
    }
    renderAll();
}

function renderAll() {
    renderProducts();
    renderBrands();
    renderStats();
}

function renderProducts() {
    const list = document.getElementById('product-list-body');
    if(!list) return;
    list.innerHTML = allProducts.map(p => {
        const imgSrc = p.img || p.image || '';
        const imgTag = imgSrc 
            ? `<img src="${imgSrc}" class="td-img" onerror="this.src='logo.jpg'">`
            : `<img src="logo.jpg" class="td-img">`;
        return `
        <tr>
            <td>${imgTag}</td>
            <td style="font-weight:500;">${p.name}</td>
            <td style="color:var(--text-muted);">${p.brand || '-'}</td>
            <td style="color:var(--gold); font-weight:600;">₹${p.price}</td>
            <td>${p.available
                ? '<span style="background:rgba(76,175,80,0.15);color:#4CAF50;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">In Stock</span>'
                : '<span style="background:rgba(244,67,54,0.15);color:#f44336;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">OOS</span>'
            }</td>
            <td class="action-btns">
                <i class="ri-pencil-line" title="Edit" onclick="window.editProduct('${p.id}')"></i>
                <i class="ri-delete-bin-line" title="Delete" onclick="window.deleteProduct('${p.id}')"></i>
            </td>
        </tr>`;
    }).join('');
}

function renderBrands() {
    const brandList = document.getElementById('brand-list');
    if(brandList) {
        brandList.innerHTML = allBrands.map(b => `
            <div style="display:flex; justify-content:space-between; padding:8px 1rem; border-bottom:1px solid var(--gold-border);">
                <span>${b.name}</span>
                <i class="ri-close-line" style="cursor:pointer; color:#ff4d4d;" onclick="window.deleteBrand('${b.id}')"></i>
            </div>
        `).join('');
    }
    const sel = document.getElementById('p-brand');
    if(sel) sel.innerHTML = allBrands.map(b => `<option value="${b.name}">${b.name}</option>`).join('');
}

function renderStats() {
    const tp = document.getElementById('total-p');
    const oos = document.getElementById('oos-p');
    const feat = document.getElementById('featured-p');
    
    if(tp) tp.textContent = allProducts.length;
    if(oos) oos.textContent = allProducts.filter(p => !p.available).length;
    if(feat) feat.textContent = allProducts.filter(p => p.featured).length;
}

// --- CATEGORY LOGIC ---
const CATEGORY_MAP = {
    perfume: ['Oud', 'Tobacco', 'Arabian', 'Floral', 'Woody', 'Fresh', 'Musky', 'Attar'],
    dates: ['Ajwa', 'Medjool', 'Kalmi', 'Mabroom', 'Sukkari', 'Safawi'],
    other: ['Incense', 'Bukhoor', 'Gift Set', 'Accessories']
};

function updateTypeOptions(cat) {
    const typeSel = document.getElementById('p-type');
    if(!typeSel) return;
    const options = CATEGORY_MAP[cat] || [];
    typeSel.innerHTML = options.map(o => `<option value="${o.toLowerCase()}">${o}</option>`).join('');
}

// --- PRODUCT OPERATIONS ---
window.editProduct = (id) => {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    editingId = id;
    document.getElementById('p-name').value = p.name;
    if(document.getElementById('p-brand')) document.getElementById('p-brand').value = p.brand;
    document.getElementById('p-cat').value = p.category;
    updateTypeOptions(p.category); // sync type dropdown
    document.getElementById('p-type').value = p.type;
    document.getElementById('p-desc').value = p.description || '';
    const imgUrl = p.img || p.image || '';
    document.getElementById('p-img-path').value = imgUrl;
    document.getElementById('p-tag').value = p.tag || '';
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-featured').checked = p.featured;
    document.getElementById('p-available').checked = p.available;
    const container = document.getElementById('size-rows-container');
    container.innerHTML = '';
    if (p.sizes) p.sizes.forEach(s => addSizeRow(s.label, s.price));
    
    // Show existing image in the upload zone
    const preview = document.getElementById('img-preview');
    const placeholder = document.getElementById('img-upload-placeholder');
    const zone = document.getElementById('img-upload-zone');
    if(imgUrl && preview) {
        preview.src = imgUrl;
        preview.style.display = 'block';
        if(placeholder) placeholder.style.display = 'none';
        if(zone) zone.classList.add('has-image');
    } else {
        if(preview) { preview.style.display = 'none'; preview.src = ''; }
        if(placeholder) placeholder.style.display = 'block';
        if(zone) zone.classList.remove('has-image');
    }
    
    document.getElementById('modal-title').textContent = 'Edit Product';
    document.getElementById('admin-product-modal').classList.add('active');
    initImageZone();
};

window.deleteProduct = async (id) => {
    if(confirm("Delete product?")) {
        await deleteDoc(doc(db, 'products', id));
        loadAll();
        showToast("Product deleted");
    }
};

async function handleProductSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('save-p-btn');
    btn.disabled = true; btn.textContent = 'Saving...';
    try {
        const sizes = [];
        document.querySelectorAll('.size-row').forEach(row => {
            const label = row.querySelector('.s-label').value;
            const price = parseFloat(row.querySelector('.s-price').value);
            if (label && price) sizes.push({ label, price });
        });
        const data = {
            name: document.getElementById('p-name').value,
            brand: document.getElementById('p-brand').value,
            category: document.getElementById('p-cat').value,
            type: document.getElementById('p-type').value,
            description: document.getElementById('p-desc').value,
            img: document.getElementById('p-img-path').value,
            tag: document.getElementById('p-tag').value,
            price: parseFloat(document.getElementById('p-price').value),
            featured: document.getElementById('p-featured').checked,
            available: document.getElementById('p-available').checked,
            sizes: sizes,
            updatedAt: new Date().toISOString()
        };
        if (editingId) await updateDoc(doc(db, 'products', editingId), data);
        else await addDoc(collection(db, 'products'), data);
        document.getElementById('admin-product-modal').classList.remove('active');
        loadAll();
        showToast("Saved successfully");
    } catch (err) { showToast("Save failed", "error"); }
    finally { btn.disabled = false; btn.textContent = 'Save Product'; }
}

function addSizeRow(label = '', price = '') {
    const div = document.createElement('div');
    div.className = 'size-row';
    div.innerHTML = `
        <input type="text" class="admin-input s-label" placeholder="Size" value="${label}">
        <input type="number" class="admin-input s-price" placeholder="Price" value="${price}">
        <i class="ri-delete-bin-line" style="color:#f44336; cursor:pointer;" onclick="this.parentElement.remove()"></i>
    `;
    document.getElementById('size-rows-container').appendChild(div);
}

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    if(!t) return;
    t.querySelector('span').textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// --- OTHER ---
async function handleAddBrand() {
    const val = document.getElementById('new-brand-input').value;
    if(val) {
        await addDoc(collection(db, 'brands'), { name: val });
        document.getElementById('new-brand-input').value = '';
        loadAll();
    }
}
async function handleSaveSettings() {
    const wa = document.getElementById('set-wa').value;
    const insta = document.getElementById('set-insta').value;
    await setDoc(doc(db, 'settings', 'shop'), { whatsapp: wa, instagram: insta }, { merge: true });
    showToast("Shop updated");
}
async function handleSaveAdminAccess() {
    const emailsRaw = document.getElementById('set-admin-emails').value;
    const emailList = emailsRaw.split(',').map(e => e.trim().toLowerCase()).filter(e => e !== '');
    await setDoc(doc(db, 'settings', 'admins'), { emails: emailList }, { merge: true });
    showToast("Access Updated");
}
async function handleBulkUpload() {
    const area = document.getElementById('bulk-json');
    const btn = document.getElementById('run-bulk-btn');
    const fileInput = document.getElementById('bulk-file');
    let jsonText = area.value.trim();

    if (!jsonText && fileInput?.files?.length) {
        try {
            jsonText = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (ev) => resolve(ev.target.result);
                reader.onerror = () => reject(new Error('Could not read JSON file'));
                reader.readAsText(fileInput.files[0]);
            });
            area.value = jsonText;
            showToast('✅ JSON file loaded from disk. Uploading now...');
        } catch (fileErr) {
            console.error('File read error:', fileErr);
            showToast('File read failed: ' + fileErr.message, 'error');
            return;
        }
    }

    if (!jsonText) {
        showToast('JSON textarea is empty!', 'error');
        return;
    }

    let data;
    try {
        data = JSON.parse(jsonText);
    } catch (parseErr) {
        console.error('JSON Parse Error:', parseErr.message);
        showToast('❌ JSON Error: ' + parseErr.message.substring(0, 60), 'error');
        return;
    }

    if (!Array.isArray(data)) {
        data = [data];
    }

    btn.disabled = true;
    btn.textContent = `Uploading 1/${data.length}...`;

    try {
        const user = auth.currentUser;
        if (!user) {
            showToast('Please login first. Upload requires admin access.', 'error');
            return;
        }
        for (let i = 0; i < data.length; i++) {
            const p = data[i];
            await addDoc(collection(db, 'products'), { ...p, updatedAt: new Date().toISOString() });
            btn.textContent = `Uploading ${i+1}/${data.length}...`;
            console.log(`✅ Uploaded: ${p.name}`);
        }
        showToast(`✅ ${data.length} products uploaded!`);
        area.value = '';
        if (fileInput) fileInput.value = '';
        loadAll();
    } catch (e) {
        console.error('Upload error:', e, 'user', auth.currentUser?.email);
        const userInfo = auth.currentUser ? ` (${auth.currentUser.email})` : '';
        let errMsg = e.message || e;
        if (String(errMsg).toLowerCase().includes('permission')) {
            errMsg += ' — ensure your signed-in email is listed under Settings > Admin Access and Firestore rules are updated.';
        }
        showToast('Upload failed: ' + errMsg + userInfo, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Sabko Firestore mein Upload Karo';
    }
}

// --- FILE READER FOR BULK UPLOAD ---
function initBulkFileReader() {
    const fileInput = document.getElementById('bulk-file');
    const textarea = document.getElementById('bulk-json');
    if(!fileInput || !textarea) return;
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            textarea.value = ev.target.result;
            showToast('✅ JSON file loaded! Click Upload to proceed.');
        };
        reader.onerror = () => showToast('Could not read file', 'error');
        reader.readAsText(file);
    });
}

init();
initBulkFileReader();
