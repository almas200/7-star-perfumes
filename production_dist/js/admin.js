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
let dynamicCategories = {};
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
            updateTypeOptions('perfume');
            initImageZone();
        }
        if (id === 'close-modal-btn') {
            document.getElementById('admin-product-modal').classList.remove('active');
        }
        if (id === 'add-size-row') addSizeRow();
        if (id === 'save-brand-btn') handleAddBrand();
        if (id === 'save-settings-btn') handleSaveSettings();
        if (id === 'save-admin-access-btn') handleSaveAdminAccess();
        if (id === 'save-cat-mgr-btn') handleSaveCategories();
        if (id === 'p-type-refresh') { loadAll(); showToast("Categories refreshed"); }
        if (id === 'run-bulk-btn') handleBulkUpload();

        // Sidebar Toggle Logic (Mobile)
        if (id === 'menu-open-btn' || e.target.closest('#menu-open-btn')) {
            console.log("Admin: Opening Sidebar Drawer");
            const sb = document.getElementById('admin-sidebar');
            const ov = document.getElementById('sidebar-overlay');
            if(sb && ov) {
                sb.classList.add('active');
                ov.classList.add('active');
            }
        }
        if (id === 'sidebar-overlay' || e.target.closest('#sidebar-overlay') || e.target.closest('.nav-item') || id === 'sb-close-btn' || e.target.closest('#sb-close-btn')) {
            console.log("Admin: Closing Sidebar Drawer");
            const sb = document.getElementById('admin-sidebar');
            const ov = document.getElementById('sidebar-overlay');
            if(sb && ov) {
                sb.classList.remove('active');
                ov.classList.remove('active');
            }
        }
    });

    const catMgrSelect = document.getElementById('cat-mgr-select');
    if(catMgrSelect) catMgrSelect.addEventListener('change', (e) => {
        const cat = e.target.value;
        const input = document.getElementById('cat-mgr-input');
        input.value = (dynamicCategories[cat] || []).join(', ');
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

    // Brand Search
    const bSearch = document.getElementById('brand-search');
    if(bSearch) bSearch.addEventListener('input', (e) => renderBrands(e.target.value));
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
            if(loginScreen) loginScreen.style.display = 'none';
            if(dashboard) dashboard.style.display = 'block';
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

    if(avatar) avatar.textContent = initials;
    if(nameEl) nameEl.textContent = name;
    if(emailEl) emailEl.textContent = email;
    if(badge) badge.style.display = 'flex';
}

async function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
        await signInWithPopup(auth, provider);
    } catch (e) { alert("Google Access Interrupted."); }
}

// --- IMAGE UPLOAD (ImgBB) Simplified ---
async function handleImageUpload(e) {
    const file = e.target.files[0];
    if(!file) return;
    
    const pathInput = document.getElementById('p-img-path');
    const preview = document.getElementById('img-preview');
    const statusText = document.getElementById('upload-status-text');
    
    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    if(preview) {
        preview.src = localUrl;
        preview.style.opacity = '0.5';
    }
    if(statusText) statusText.textContent = "Uploading... please wait.";
    
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
            if(preview) {
                preview.src = data.data.url;
                preview.style.opacity = '1';
            }
            showToast('✅ Image Uploaded!');
            if(statusText) statusText.textContent = "Upload successful.";
        } else throw new Error('Upload Failed');
    } catch (err) {
        showToast('Upload Fail — Check Internet/API', 'error');
        if(statusText) statusText.textContent = "Upload failed. Check connection.";
        if(preview) preview.style.opacity = '1';
    }
}

// initImageZone removed for simplification

// --- RESOURCE LOADING ---
async function loadAll() {
    try {
        const [pSnap, bSnap, sSnap, aSnap, cSnap, stSnap] = await Promise.all([
            getDocs(collection(db, 'products')),
            getDocs(collection(db, 'brands')),
            getDoc(doc(db, 'settings', 'shop')),
            getDoc(doc(db, 'settings', 'admins')),
            getDocs(collection(db, 'categories')),
            getDoc(doc(db, 'stats', 'site'))
        ]);
        
        allProducts = []; pSnap.forEach(d => allProducts.push({id: d.id, ...d.data()}));
        allBrands = []; bSnap.forEach(d => allBrands.push({id: d.id, ...d.data()}));
        
        // syncExistingBrands() removed - it triggers too many writes on load.
        // Sync should be done manually or once.

        dynamicCategories = {};
        cSnap.forEach(d => dynamicCategories[d.id] = d.data().types || []);
        
        if(sSnap.exists()) {
            const d = sSnap.data();
            document.getElementById('set-wa').value = d.whatsapp || '';
            document.getElementById('set-insta').value = d.instagram || '';
        }
        if(aSnap.exists()) {
            document.getElementById('set-admin-emails').value = (aSnap.data().emails || []).join(', ');
        }
        if(stSnap.exists()) {
            const d = stSnap.data();
            document.getElementById('stat-visits').textContent = d.visits || 0;
            document.getElementById('stat-wa-clicks').textContent = d.whatsapp_clicks || 0;
        }
        
        // Refresh Category Manager initial value
        const curCat = document.getElementById('cat-mgr-select').value;
        document.getElementById('cat-mgr-input').value = (dynamicCategories[curCat] || []).join(', ');

        renderAll();
    } catch (e) { console.error("Load failed:", e); }
}

async function ensureBrandExists(brandName) {
    if (!brandName) return;
    const cleanName = brandName.trim();
    const exists = allBrands.some(b => b.name.toLowerCase() === cleanName.toLowerCase());
    if (!exists) {
        console.log(`Auto-Adding Brand: ${brandName}`);
        try {
            const newBrand = { name: cleanName, createdAt: new Date().toISOString() };
            const docRef = await addDoc(collection(db, 'brands'), newBrand);
            allBrands.push({ id: docRef.id, ...newBrand });
        } catch (e) { console.warn("Auto-brand add failed:", e); }
    }
}

async function syncExistingBrands() {
    const productBrands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))];
    for (const b of productBrands) {
        await ensureBrandExists(b);
    }
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
        // safer img tag without infinite loop potential
        const imgTag = imgSrc 
            ? `<img src="${imgSrc}" class="td-img" onerror="this.onerror=null;this.src='logo.jpg'">`
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

function renderBrands(query = '') {
    const brandList = document.getElementById('brand-list');
    const brandCount = document.getElementById('stat-brands');
    if(brandCount) brandCount.textContent = allBrands.length;

    if(brandList) {
        const sorted = [...allBrands].sort((a,b) => a.name.localeCompare(b.name));
        const filtered = sorted.filter(b => b.name.toLowerCase().includes(query.toLowerCase()));
        
        brandList.innerHTML = filtered.map(b => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 1rem; border-bottom:1px solid rgba(212,168,83,0.1); transition:0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                <span style="font-weight:500;">${b.name}</span>
                <i class="ri-delete-bin-line" style="cursor:pointer; color:var(--text-muted); font-size:18px;" onmouseover="this.style.color='#f44336'" onmouseout="this.style.color='var(--text-muted)'" onclick="window.deleteBrand('${b.id}')"></i>
            </div>
        `).join('') || '<p style="text-align:center; padding:2rem; color:var(--text-muted); font-size:13px;">No brands found...</p>';
    }
    const sel = document.getElementById('p-brand');
    if(sel) {
        const sorted = [...allBrands].sort((a,b) => a.name.localeCompare(b.name));
        sel.innerHTML = sorted.map(b => `<option value="${b.name}">${b.name}</option>`).join('');
    }
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

const CATEGORY_FALLBACKS = {
    perfume: ['Oud', 'Tobacco', 'Arabian', 'Floral', 'Woody', 'Fresh', 'Musky', 'Attar'],
    dates: ['Ajwa', 'Medjool', 'Kalmi', 'Mabroom', 'Sukkari', 'Safawi'],
    other: ['Incense', 'Bukhoor', 'Gift Set', 'Accessories']
};

function updateTypeOptions(cat) {
    const typeSel = document.getElementById('p-type');
    if(!typeSel) return;
    
    // Get from Firestore, otherwise use fallback
    let options = dynamicCategories[cat] || [];
    if(options.length === 0) options = CATEGORY_FALLBACKS[cat] || [];
    
    typeSel.innerHTML = options.map(o => `<option value="${o.trim().toLowerCase()}">${o.trim()}</option>`).join('');
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
    
    // Show existing image
    const preview = document.getElementById('img-preview');
    if(imgUrl && preview) {
        preview.src = imgUrl;
    } else if(preview) {
        preview.src = 'logo.jpg';
    }
    
    document.getElementById('modal-title').textContent = 'Edit Product';
    document.getElementById('admin-product-modal').classList.add('active');
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

        // Auto-Register brand if it's new
        await ensureBrandExists(data.brand);

        if (editingId) await updateDoc(doc(db, 'products', editingId), data);
        else await addDoc(collection(db, 'products'), data);
        
        // BUST CACHE for all users
        await setDoc(doc(db, 'settings', 'site'), { lastUpdated: Date.now() }, { merge: true });
        
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
    const btn = document.getElementById('save-brand-btn');
    const input = document.getElementById('new-brand-input');
    const val = input.value.trim();
    if(!val) return;
    
    btn.disabled = true;
    btn.textContent = 'Adding...';
    try {
        await addDoc(collection(db, 'brands'), { 
            name: val,
            createdAt: new Date().toISOString()
        });
        input.value = '';
        await loadAll();
        showToast(`Brand "${val}" added!`);
    } catch (e) {
        console.error("Brand add failed:", e);
        showToast("Failed to add brand", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Add';
    }
}

window.deleteBrand = async (id) => {
    if(confirm("Are you sure you want to delete this brand?")) {
        try {
            await deleteDoc(doc(db, 'brands', id));
            await loadAll();
            showToast("Brand deleted");
        } catch (e) {
            showToast("Delete failed", "error");
        }
    }
};
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

async function handleSaveCategories() {
    const cat = document.getElementById('cat-mgr-select').value;
    const typesRaw = document.getElementById('cat-mgr-input').value;
    const typesList = typesRaw.split(',').map(t => t.trim()).filter(t => t !== '');
    
    try {
        await setDoc(doc(db, 'categories', cat), { types: typesList }, { merge: true });
        showToast(`Updated ${cat} categories`);
        loadAll();
    } catch (e) { showToast("Failed to update categories", "error"); }
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
            // Auto-Register brand if it's new
            if (p.brand) await ensureBrandExists(p.brand);
            
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
