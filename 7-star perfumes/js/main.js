import { db, SHOP, STORAGE_BUCKET } from './firebase-config.js';
import { collection, getDocs, doc, getDoc, updateDoc, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// SEED DATA 
const SEED_PRODUCTS = [
    { id: 'p1', name: 'Blue Oud', brand: 'Ahmed Al Maghribi', category: 'perfume', type: 'oud', price: 3500, img: 'p1.jpeg', featured: true, description: 'A masterpiece of deep, woody oud notes blended with fresh marine accords.', sizes: [{label: '100ml', price: 3500}, {label: '50ml', price: 2000}], available: true, tag: 'Bestseller' },
    { id: 'p2', name: 'Zumar', brand: 'Ahmed Al Maghribi', category: 'perfume', type: 'floral', price: 4200, img: 'p2.jpeg', featured: true, description: 'Exotic floral notes meeting the warmth of Arabian musk. A royal choice.', sizes: [{label: '75ml', price: 4200}], available: true, tag: 'New' },
    { id: 'p3', name: 'Bin Shaikh', brand: 'Ahmed Al Maghribi', category: 'perfume', type: 'musky', price: 4800, img: 'p3.jpeg', featured: true, description: 'The fragrance of authority. Bold, spicy, and unforgettable.', sizes: [{label: '90ml', price: 4800}], available: true, tag: 'Premium' },
    { id: 'p4', name: 'Greek Tobacco', brand: 'Paris Corner', category: 'perfume', type: 'tobacco', price: 2800, img: 'p4.jpeg', featured: true, description: 'Rich tobacco leaves infused with vanilla and dry fruits.', sizes: [{label: '100ml', price: 2800}], available: true, tag: 'Popular' },
    { id: 'p5', name: 'North Stag Sept VII', brand: 'Paris Corner', category: 'perfume', type: 'fresh', price: 3200, img: 'p5.jpeg', featured: false, description: 'A crisp, energetic fragrance for the modern gentleman.', sizes: [{label: '100ml', price: 3200}], available: true },
    { id: 'p6', name: 'Killer Oud', brand: 'Paris Corner', category: 'perfume', type: 'oud', price: 2400, img: 'p6.jpeg', featured: false, description: 'Intense oud with a smokey finish. Not for the faint-hearted.', sizes: [{label: '100ml', price: 2400}], available: true },
    { id: 'p7', name: 'Afnan 9PM', brand: 'Afnan', category: 'perfume', type: 'arabian', price: 3500, img: 'p7.jpeg', featured: true, description: 'The ultimate evening fragrance. Sweet, spicy, and magnetic.', sizes: [{label: '100ml', price: 3500}], available: true, tag: 'Trending' },
    { id: 'p8', name: 'Turathi Blue', brand: 'Afnan', category: 'perfume', type: 'fresh', price: 3800, img: 'p8.jpeg', featured: false, description: 'A refreshing blast of citrus and grapefruit on a woody base.', sizes: [{label: '90ml', price: 3800}], available: true },
    { id: 'p9', name: 'Asad', brand: 'Lattafa', category: 'perfume', type: 'arabian', price: 2200, img: 'p9.jpeg', featured: true, description: 'A bold, spicy Arabian scent with incredible longevity.', sizes: [{label: '100ml', price: 2200}], available: true },
    { id: 'p10', name: 'Khamrah', brand: 'Lattafa', category: 'perfume', type: 'tobacco', price: 2500, img: 'p10.jpeg', featured: true, description: 'Sweet, boozy, and warm. Like a luxury vacation in a bottle.', sizes: [{label: '100ml', price: 2500}], available: true, tag: 'Limited' },
    { id: 'p11', name: 'Velvet Oud', brand: 'Lattafa', category: 'perfume', type: 'oud', price: 1800, img: 'p11.jpeg', featured: false, description: 'Smooth, wearable oud with a touch of leather.', sizes: [{label: '100ml', price: 1800}], available: true },
    { id: 'p12', name: 'Bade\'e Al Oud', brand: 'Lattafa', category: 'perfume', type: 'oud', price: 2600, img: 'p12.jpeg', featured: false, description: 'Often called "Oud for Glory". A deep, mysterious fragrance.', sizes: [{label: '100ml', price: 2600}], available: true },
    { id: 'p13', name: 'Club de Nuit Intense', brand: 'Armaf', category: 'perfume', type: 'woody', price: 3800, img: 'p13.jpeg', featured: true, description: 'The legendary citrus-woody fragrance. A worldwide bestseller.', sizes: [{label: '105ml', price: 3800}], available: true },
    { id: 'p14', name: 'Dry Dates Medjool', brand: 'Khyber', category: 'dates', type: 'fresh', price: 1200, img: 'dates.jpeg', featured: true, description: 'Premium Medjool dates, known for their large size and caramel sweetness.', sizes: [{label: '500g', price: 650}, {label: '1kg', price: 1200}], available: true, tag: 'Imported' },
    { id: 'p15', name: 'Kimia Dates', brand: 'Imported', category: 'dates', type: 'fresh', price: 550, img: 'dates_2.jpeg', featured: false, description: 'Authentic Kimia dates. Soft, moist, and naturally sweet.', sizes: [{label: '500g', price: 550}], available: true },
    { id: 'p16', name: 'Oud Al Mithali', brand: 'Rasasi', category: 'perfume', type: 'oud', price: 2900, img: 'p14.jpeg', featured: false, description: 'A balanced oud with floral and sandalwood notes.', sizes: [{label: '100ml', price: 2900}], available: true },
    { id: 'p17', name: 'Shaghaf Oud', brand: 'Swiss Arabian', category: 'perfume', type: 'oud', price: 3400, img: 'p15.jpeg', featured: false, description: 'Warm gourmand oud. Vanilla, praline, and roses.', sizes: [{label: '75ml', price: 3400}], available: true },
    { id: 'p18', name: 'Tobacco Vanille Clone', brand: 'Seven Star', category: 'perfume', type: 'tobacco', price: 1500, img: 'p16.jpeg', featured: false, description: 'Our signature house blend inspired by luxury tobacco fragrances.', sizes: [{label: '50ml', price: 1500}], available: true },
    { id: 'p19', name: 'Royal Musk', brand: 'Surrati', category: 'perfume', type: 'musky', price: 1200, img: 'p17.jpeg', featured: false, description: 'Pure white musk attar. Clean, powdery, and long-lasting.', sizes: [{label: '12ml', price: 1200}], available: true },
    { id: 'p20', name: 'Amber Wood', brand: 'Ajmal', category: 'perfume', type: 'woody', price: 6500, img: 'p18.jpeg', featured: false, description: 'Masterpiece of the W-Series. Deep amber and rich woods.', sizes: [{label: '100ml', price: 6500}], available: true },
    { id: 'p21', name: 'Khasak', brand: 'Ahmed Al Maghribi', category: 'perfume', type: 'fresh', price: 3900, img: 'p19.jpeg', featured: false, description: 'Crisp aquatic notes for a refreshing summer vibe.', sizes: [{label: '100ml', price: 3900}], available: true },
    { id: 'p22', name: 'Leather Oud', brand: 'Paris Corner', category: 'perfume', type: 'oud', price: 2700, img: 'p20.jpeg', featured: false, description: 'Sophisticated leather combined with dark Arabian oud.', sizes: [{label: '100ml', price: 2700}], available: true },
    { id: 'p23', name: 'Majestic Gold', brand: 'Seven Star', category: 'other', type: 'floral', price: 950, img: 'other)item.jpeg', featured: false, description: 'A special assorted gift set containing miniature perfumes.', sizes: [{label: 'Set', price: 950}], available: true },
    { id: 'p24', name: 'Musk Rijali', brand: 'Surrati', category: 'perfume', type: 'musky', price: 850, img: 'p21.jpeg', featured: false, description: 'Authentic Arabian musk attar. Deep and spiritual.', sizes: [{label: '6ml', price: 450}, {label: '12ml', price: 850}], available: true },
    { id: 'p25', name: 'Wild Rose', brand: 'Seven Star', category: 'perfume', type: 'floral', price: 1100, img: 'p22.jpeg', featured: false, description: 'Fresh blooming roses captured in a concentrated oil.', sizes: [{label: '12ml', price: 1100}], available: true },
    { id: 'p33', name: 'Hawas Ice', brand: 'Rasasi', category: 'perfume', type: 'fresh', price: 2950, img: 'p33.jpeg', description: 'A refreshing and cool evolution of the legendary Hawas.', sizes: [{label: '100ml', price: 2950}], available: true, tag: 'Trending' },
    { id: 'p34', name: 'Hawas Him', brand: 'Rasasi', category: 'perfume', type: 'fresh', price: 2450, img: 'p34.jpeg', description: 'The OG masterpiece. Aquatic, fruity, and long-lasting.', sizes: [{label: '100ml', price: 2450}], available: true, tag: 'Bestseller' },
    { id: 'p35', name: 'Hawas Fire', brand: 'Rasasi', category: 'perfume', type: 'tobacco', price: 3200, img: 'p35.jpeg', description: 'A bold and spicy take on the Hawas DNA.', sizes: [{label: '100ml', price: 3200}], available: true, tag: 'New' },
    { id: 'p36', name: 'Hawas Black', brand: 'Rasasi', category: 'perfume', type: 'woody', price: 2550, img: 'p36.jpeg', description: 'A darker, more intense version of Hawas.', sizes: [{label: '100ml', price: 2550}], available: true },
    { id: 'p37', name: 'Hawas London', brand: 'Rasasi', category: 'perfume', type: 'arabian', price: 3100, img: 'p37.jpeg', description: 'Sophisticated fragrance blending European and Arabian depth.', sizes: [{label: '100ml', price: 3100}], available: true },
    { id: 'p38', name: 'Hawas Elixir', brand: 'Rasasi', category: 'perfume', type: 'arabian', price: 2500, img: 'p38.jpeg', description: 'Concentrated luxury with a powerful trail.', sizes: [{label: '100ml', price: 2500}], available: true, tag: 'Premium' },
    { id: 'p39', name: 'Shuhrah Perfume', brand: 'Rasasi', category: 'perfume', type: 'floral', price: 1800, img: 'p39.jpeg', description: 'An iconic floral and leather fragrance.', sizes: [{label: '100ml', price: 1800}], available: true },
    { id: 'p40', name: 'Fattan Perfume', brand: 'Rasasi', category: 'perfume', type: 'fresh', price: 1100, img: 'p40.jpeg', description: 'A dry, earthy, and fresh vetiver fragrance.', sizes: [{label: '100ml', price: 1100}], available: true },
    { id: 'p41', name: 'Daarej', brand: 'Rasasi', category: 'perfume', type: 'arabian', price: 1400, img: 'p41.jpeg', description: 'Spicy, sweet, and seductive oriental classics.', sizes: [{label: '100ml', price: 1400}], available: true },
    { id: 'p42', name: 'Arba Wardat', brand: 'Rasasi', category: 'perfume', type: 'floral', price: 1650, img: 'p42.jpeg', description: 'A beautiful, high-quality concentrated perfume oil.', sizes: [{label: '30ml', price: 1650}], available: true, tag: 'Attar' },
    { id: 'p43', name: 'Mukhallat Oud', brand: 'Rasasi', category: 'perfume', type: 'oud', price: 850, img: 'p43.jpeg', description: 'A traditional blend of rich oud and essential oils.', sizes: [{label: '20ml', price: 850}], available: true, tag: 'Attar' },
    { id: 'p44', name: 'Amber Oud Attar', brand: 'Rasasi', category: 'perfume', type: 'oud', price: 850, img: 'p44.jpeg', description: 'Warm amber meets authentic oud in this concentrated oil.', sizes: [{label: '14ml', price: 850}], available: true, tag: 'Attar' },
    { id: 'p45', name: 'Romance Attar', brand: 'Rasasi', category: 'perfume', type: 'floral', price: 750, img: 'p45.jpeg', description: 'A sweet, romantic, and airy fragrance oil.', sizes: [{label: '14ml', price: 750}], available: true, tag: 'Attar' },
    { id: 'p46', name: 'Oud Mithali', brand: 'Rasasi', category: 'perfume', type: 'oud', price: 1900, img: 'p46.jpeg', description: 'Balanced, deep, and regal Arabian oud.', sizes: [{label: '30ml', price: 1900}], available: true, tag: 'Attar' }
];

// STATE management
let allProducts = [];
let cart = [];
let activeCategory = 'all';
let activeType = 'all';
let searchQuery = '';
let currentProduct = null;
let selectedSizeIndex = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Animations ASAP with fast speed
    // AOS Removed for performance stability

    
    // SAFE INITIALIZATION WRAPPER
    const safeInit = (fn, name) => {
        try { fn(); } catch(e) { console.error(`Initialization failed: ${name}`, e); }
    };

    safeInit(initTheme, 'Theme');
    safeInit(cleanupOldCache, 'Cache Cleanup');
    safeInit(initNavbar, 'Navbar');
    safeInit(initSearch, 'Search');
    safeInit(initCategoryNav, 'CategoryNav');
    safeInit(initCartUI, 'CartUI');
    safeInit(initFloatingHub, 'FloatingHub');
    safeInit(initModalEvents, 'ModalEvents');
    safeInit(initPWA, 'PWA');
    
    // 2. Immediate Initial Render (Seed Data)
    allProducts = [...SEED_PRODUCTS];
    renderFeatured(allProducts.filter(p => p.featured));
    renderProducts(); 
    
    // 3. Fetch live data
    updateCartBadge();
    renderCartItems();
    trackVisit();
    
    fetchProducts().then(() => {
        populateBrandFilter();
        renderRecentlyViewed();
    }).catch(e => {
        console.warn("Live fetch failed, staying on seed data", e);
        renderProducts();
    });
});

async function trackVisit() {
    try {
        await updateDoc(doc(db, 'stats', 'site'), { visits: increment(1) });
    } catch (e) { console.warn("Visit tracking failed:", e); }
}

async function trackWhatsAppClick() {
    try {
        await updateDoc(doc(db, 'stats', 'site'), { whatsapp_clicks: increment(1) });
    } catch (e) { console.warn("WA tracking failed:", e); }
}

function cleanupOldCache() {
    const keys = ['ssp_products_v1', 'ssp_products_v2', 'ssp_products_v3'];
    keys.forEach(k => localStorage.removeItem(k));
}

// 1. Theme logic
function initTheme() {
    const savedTheme = localStorage.getItem('ssp-theme') || 'dark';
    applyTheme(savedTheme);
    
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const current = document.body.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem('ssp-theme', next);
    });
}

function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    const sunIcon = document.getElementById('icon-sun');
    const moonIcon = document.getElementById('icon-moon');
    if (sunIcon && moonIcon) {
        if (theme === 'light') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    }
}

// 3. fetchProducts with cache
async function fetchProducts() {
    const CACHE_KEY = 'ssp_products_v4';
    const TTL = 15 * 60 * 1000; // 15 mins
    
    try {
        // QUICK CACHE BUST CHECK
        const settingsSnap = await getDoc(doc(db, 'settings', 'site'));
        const serverLastUpdated = settingsSnap.exists() ? settingsSnap.data().lastUpdated : 0;
        
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { data, timestamp, version } = JSON.parse(cached);
            // If cache is fresh AND server says no new updates since our cache timestamp
            if (Date.now() - timestamp < TTL && version >= (serverLastUpdated || 0)) {
                allProducts = data;
                renderFeatured(allProducts.filter(p => p.featured));
                renderProducts();
                return;
            }
        }
    } catch (e) { console.warn("Cache check failed:", e); }
    
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        
        if (products.length > 0) {
            allProducts = products;
            const settingsSnap = await getDoc(doc(db, 'settings', 'site'));
            const serverVer = settingsSnap.exists() ? settingsSnap.data().lastUpdated : Date.now();
            localStorage.setItem(CACHE_KEY, JSON.stringify({ 
                data: products, 
                timestamp: Date.now(),
                version: serverVer
            }));
            renderFeatured(allProducts.filter(p => p.featured));
            renderProducts();
        }
        
        // Final Render
        renderProducts();
        
        // Version Check (Anti-Cache Force sync)
        const settingsSnap = await getDoc(doc(db, 'settings', 'site'));
        if (settingsSnap.exists()) {
            const remoteVer = settingsSnap.data().version || 1;
            const localVer = parseInt(localStorage.getItem('ssp_app_version') || '0');
            if (remoteVer > localVer) {
                localStorage.setItem('ssp_app_version', remoteVer);
                window.location.reload(true); // Force clear reload
            }
        }
        
    } catch (err) {
        console.warn("Using seed data, Firestore failed:", err);
        renderProducts(); // Render seed data on fail
    }
}

// 4. Navbar
function initNavbar() {
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        if (window.scrollY > 40) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
    });
}

// 5. Search
function initSearch() {
    const dSearch = document.getElementById('desktop-search');
    const mSearch = document.getElementById('mobile-search-input');
    const toggleBtn = document.getElementById('search-toggle-btn');
    const mBar = document.getElementById('mobile-search-bar');
    
    [dSearch, mSearch].forEach(input => {
        input.addEventListener('input', (e) => {
            const query = e.target.value;
            doSearch(query);
            searchQuery = query.trim().toLowerCase();
            renderProducts();
        });
    });
    
    toggleBtn.addEventListener('click', () => mBar.classList.toggle('active'));
    
    // Close search on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-search-wrap') && !e.target.closest('#search-dropdown') && !e.target.closest('#mobile-search-bar')) {
            document.getElementById('search-dropdown').classList.remove('active');
        }
    });
}

function doSearch(query) {
    const dropdown = document.getElementById('search-dropdown');
    if (!query.trim()) {
        dropdown.classList.remove('active');
        return;
    }
    
    const results = allProducts.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        p.brand.toLowerCase().includes(query.toLowerCase()) ||
        p.type.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);
    
    dropdown.innerHTML = results.length > 0 ? 
        results.map(p => `
            <div class="search-item" onclick="window.openModal('${p.id}')">
                <img src="${getProductImage(p)}" alt="${p.name}">
                <div class="search-item-info">
                    <div class="search-item-brand">${p.brand}</div>
                    <div class="search-item-name">${p.name}</div>
                </div>
                <div class="search-item-price">₹${p.price}</div>
            </div>
        `).join('') : '<div class="search-no-result">No perfumes found...</div>';
    
    dropdown.classList.add('active');
}

// 6. Category Nav
function initCategoryNav() {
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.dataset.cat;
            activeType = 'all';
            
            // Reset type buttons
            document.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === 'all'));
            
            // Show/Hide type sub-nav for perfumes
            const typeNav = document.getElementById('type-nav');
            if (activeCategory === 'perfume') typeNav.classList.add('show');
            else typeNav.classList.remove('show');
            
            renderProducts();
        });
    });
    
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeType = btn.dataset.type;
            renderProducts();
        });
    });
    
    document.getElementById('sort-select').addEventListener('change', renderProducts);
    
    const brandSel = document.getElementById('brand-select');
    if (brandSel) brandSel.addEventListener('change', renderProducts);
    
    const priceSel = document.getElementById('price-filter');
    if (priceSel) priceSel.addEventListener('change', renderProducts);
}

function populateBrandFilter() {
    const brandSelect = document.getElementById('brand-select');
    if(!brandSelect) return;
    const brands = [...new Set(allProducts.map(p => p.brand))].sort();
    brandSelect.innerHTML = '<option value="all">All Brands</option>' + 
        brands.map(b => `<option value="${b}">${b}</option>`).join('');
}

// 7. Featured Track
function renderFeatured(featured) {
    const track = document.getElementById('featured-track');
    const dotsContainer = document.getElementById('featured-dots');
    if(!track || !dotsContainer || !featured || featured.length === 0) return;
    
    track.innerHTML = featured.map(p => `
        <div class="featured-card" onclick="window.openModal('${p.id}')">
            ${p.tag ? `<span class="f-badge">${p.tag}</span>` : ''}
            <img src="${getProductImage(p)}" class="featured-img" alt="${p.name}">
            <div class="featured-body">
                <div class="f-brand">${p.brand}</div>
                <h3 class="f-name">${p.name}</h3>
                <div class="f-price">₹${p.price}</div>
                <div class="f-actions" onclick="event.stopPropagation()">
                    <button class="btn-add-sm" onclick="window.addToCart('${p.id}')">Add to Cart</button>
                    <button class="btn-wa-sq" onclick="window.orderOnWA('${p.id}')"><i class="ri-whatsapp-line"></i></button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Dots
    dotsContainer.innerHTML = featured.map((_, i) => `<div class="featured-dot ${i === 0 ? 'active' : ''}"></div>`).join('');
    
    // Auto Scroll logic
    let currentIndex = 0;
    setInterval(() => {
        const cardWidth = 260 + 24; // width + gap
        currentIndex = (currentIndex + 1) % featured.length;
        track.scrollTo({ left: currentIndex * cardWidth, behavior: 'smooth' });
        
        // Update dots
        document.querySelectorAll('.featured-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }, 4000);
}

// 8. Render Grid
function renderProducts() {
    const grid = document.getElementById('product-grid');
    const heading = document.getElementById('products-heading');
    if(!grid) return;
    
    const sortSelect = document.getElementById('sort-select');
    const sortVal = sortSelect ? sortSelect.value : 'default';
    
    // Sort logic: Default is Newest First (by updatedAt)
    const sorted = [...allProducts].sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeB - timeA; 
    });

    let filtered = sorted.filter(p => {
        const catMatch = activeCategory === 'all' || p.category === activeCategory;
        const typeMatch = activeType === 'all' || p.type === activeType;
        
        let brandMatch = true;
        const brandSel = document.getElementById('brand-select');
        if (brandSel && brandSel.value !== 'all') {
            brandMatch = p.brand === brandSel.value;
        }

        let priceMatch = true;
        const priceSel = document.getElementById('price-filter');
        if (priceSel) {
            const pv = priceSel.value;
            if (pv === 'under2000') priceMatch = p.price < 2000;
            else if (pv === '2000-5000') priceMatch = p.price >= 2000 && p.price <= 5000;
            else if (pv === 'over5000') priceMatch = p.price > 5000;
        }
        
        // Super-Search Logic (Tokenized)
        const queryMatch = !searchQuery || searchQuery.split(/\s+/).every(word => {
            if (!word) return true;
            const target = `${p.name} ${p.brand} ${p.type} ${p.category} ${p.description || ''} ${p.tag || ''}`.toLowerCase();
            return target.includes(word);
        });
        
        return catMatch && typeMatch && brandMatch && priceMatch && queryMatch;
    });
    
    // Manual Sort Overrides
    if (sortVal === 'low') filtered.sort((a,b) => a.price - b.price);
    else if (sortVal === 'high') filtered.sort((a,b) => b.price - a.price);
    else if (sortVal === 'name') filtered.sort((a,b) => a.name.localeCompare(b.name));
    
    heading.textContent = searchQuery ? `Search: "${searchQuery}"` : activeCategory === 'all' ? 'All Collection' : 
                         activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);
    
    grid.innerHTML = filtered.length > 0 ? filtered.map((p, i) => `
        <div class="product-card" onclick="window.openModal('${p.id}')">
            <div class="card-img-wrap">
                ${p.tag ? `<span class="card-tag">${p.tag}</span>` : ''}
                ${!p.available ? '<div class="card-out">OUT OF STOCK</div>' : ''}
                <img src="${getProductImage(p)}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='logo.jpg'">
            </div>
            <div class="card-body">
                <div class="card-brand">${p.brand}</div>
                <h3 class="card-name">${p.name}</h3>
                <div class="card-price">₹${p.price}</div>
                <div class="card-actions" onclick="event.stopPropagation()">
                    <button class="card-cart-btn" ${!p.available ? 'disabled' : ''} onclick="window.addToCart('${p.id}')">
                        ${p.available ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                    <button class="card-wa-btn" onclick="window.orderOnWA('${p.id}')"><i class="ri-whatsapp-line"></i></button>
                </div>
            </div>
        </div>
    `).join('') : '<div class="grid-state"><i class="ri-search-2-line"></i><p>No products found in this category.</p></div>';
}

// 9. Modal Logic
window.openModal = function(id) {
    addToRecentViews(id);
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    
    currentProduct = product;
    selectedSizeIndex = 0;
    
    const m = document.getElementById('product-modal');
    document.getElementById('modal-img').src = getProductImage(product);
    document.getElementById('modal-brand').textContent = product.brand;
    document.getElementById('modal-name').textContent = product.name;
    document.getElementById('modal-desc').textContent = product.description || 'Premium imported fragrance.';
    
    const tag = document.getElementById('modal-tag-badge');
    if (product.tag) {
        tag.textContent = product.tag;
        tag.style.display = 'inline-block';
    } else tag.style.display = 'none';
    
    renderModalSizes();
    updateModalPrice();
    
    m.classList.add('active');
    document.body.style.overflow = 'hidden';
};

function renderModalSizes() {
    const container = document.getElementById('modal-sizes');
    if (!currentProduct.sizes || currentProduct.sizes.length === 0) {
        container.innerHTML = ''; return;
    }
    container.innerHTML = currentProduct.sizes.map((s, i) => `
        <div class="size-chip ${i === selectedSizeIndex ? 'active' : ''}" onclick="window.selectSize(${i})">${s.label}</div>
    `).join('');
}

window.selectSize = function(i) {
    selectedSizeIndex = i;
    renderModalSizes();
    updateModalPrice();
};

function updateModalPrice() {
    const p = (currentProduct.sizes && currentProduct.sizes.length > 0) 
        ? currentProduct.sizes[selectedSizeIndex].price 
        : currentProduct.price;
    document.getElementById('modal-price').textContent = `₹${p}`;
}

// Helper to get image path with fallbacks
function getProductImage(p) {
    if (!p) return 'logo.jpg';
    let url = p.img || p.image || '';
    
    // Convert Firebase storage gs:// path to public media URL
    if (url.startsWith('gs://')) {
        const path = url.replace(/^gs:\/\/[^/]+\//, '');
        return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(path)}?alt=media`;
    }
    
    // If it's a relative local file like 'p1.jpeg' or repo asset path, return as-is
    if (url && !url.startsWith('http') && !url.startsWith('data:')) {
        return url;
    }
    
    // Fallback if ID matches a local file (e.g. p1, p2)
    if (!url && p.id && (p.id.startsWith('p') || !isNaN(p.id)) && p.id.length <= 4) {
        return `${p.id}.jpeg`;
    }
    
    return url || 'logo.jpg';
}

window.closeModal = function() {
    document.getElementById('product-modal').classList.remove('active');
    document.body.style.overflow = 'auto';
};

function initModalEvents() {
    document.getElementById('modal-close-trigger').addEventListener('click', closeModal);
    document.getElementById('product-modal').addEventListener('click', (e) => {
        if (e.target.id === 'product-modal') closeModal();
    });
    
    document.getElementById('modal-add-btn').addEventListener('click', addToCartFromModal);
    document.getElementById('modal-wa-btn').addEventListener('click', orderFromModalWA);
    document.getElementById('modal-share-btn').addEventListener('click', shareProduct);
}

// 13. Actions
function addToCartFromModal() {
    const size = (currentProduct.sizes && currentProduct.sizes.length > 0) 
        ? currentProduct.sizes[selectedSizeIndex] 
        : { label: 'Standard', price: currentProduct.price };
    addToCartWithSize(currentProduct, size.label, size.price);
    closeModal();
}

function orderFromModalWA() {
    const size = (currentProduct.sizes && currentProduct.sizes.length > 0) 
        ? currentProduct.sizes[selectedSizeIndex] 
        : { label: 'Standard', price: currentProduct.price };
    const msg = buildSingleProductWA(currentProduct, size);
    triggerWhatsApp(SHOP.whatsapp, msg);
}

window.shareProduct = function() {
    const text = `Check out ${currentProduct.name} by ${currentProduct.brand} at Seven Star Perfume!`;
    const url = window.location.href;
    if (navigator.share) {
        navigator.share({ title: 'Seven Star Perfume', text, url });
    } else {
        // Fallback to copying link
        navigator.clipboard.writeText(url).then(() => {
            window.showToast("Link copied to clipboard!");
        });
    }
};

// Intercept hardcoded links in HTML for mobile deep-linking
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="wa.me"]');
    if (link && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        e.preventDefault();
        const url = new URL(link.href);
        const phone = url.pathname.replace('/', '');
        const msg = url.searchParams.get('text') || '';
        triggerWhatsApp(phone, msg);
    }
});

window.addToCart = function(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p || !p.available) return;
    const size = (p.sizes && p.sizes.length > 0) ? p.sizes[0] : { label: 'Standard', price: p.price };
    addToCartWithSize(p, size.label, size.price);
};

window.orderOnWA = function(id) {
    const p = allProducts.find(x => x.id === id);
    const size = (p.sizes && p.sizes.length > 0) ? p.sizes[0] : { label: 'Standard', price: p.price };
    const msg = buildSingleProductWA(p, size);
    trackWhatsAppClick();
    triggerWhatsApp(SHOP.whatsapp, msg);
};

// 17. Cart Core
function addToCartWithSize(product, sizeLabel, sizePrice) {
    const cart = JSON.parse(localStorage.getItem('ssp_cart') || '[]');
    const key = `${product.id}_${sizeLabel}`;
    const existing = cart.find(item => item.cartId === key);
    
    if (existing) {
        existing.qty++;
    } else {
        cart.push({
            cartId: key,
            id: product.id,
            name: product.name,
            brand: product.brand,
            img: getProductImage(product),
            size: sizeLabel,
            price: sizePrice,
            qty: 1
        });
    }
    
    localStorage.setItem('ssp_cart', JSON.stringify(cart));
    updateCartBadge();
    renderCartItems();
    window.showToast(`Added ${product.name} to cart`);
}

function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('ssp_cart') || '[]');
    const total = cart.reduce((acc, item) => acc + item.qty, 0);
    
    const badges = ['cart-badge', 'cart-fab-badge', 'cart-count-label', 'tab-cart-badge'];
    badges.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = total;
            if (id !== 'cart-count-label' && id !== 'tab-cart-badge') el.classList.toggle('show', total > 0);
            if (id === 'tab-cart-badge') el.style.display = total > 0 ? 'flex' : 'none';
        }
    });
    
    const fab = document.getElementById('cart-fab');
    if (fab) fab.classList.toggle('show', total > 0);
}

function renderCartItems() {
    const cart = JSON.parse(localStorage.getItem('ssp_cart') || '[]');
    const container = document.getElementById('cart-items');
    const orderBtn = document.getElementById('order-wa-btn');
    const totalEl = document.getElementById('cart-total');
    
    if (cart.length === 0) {
        container.innerHTML = '<div class="cart-empty-msg"><i class="ri-shopping-bag-line" style="font-size:40px;opacity:0.3;color:var(--gold)"></i><p>Your cart is empty</p></div>';
        orderBtn.disabled = true;
        totalEl.textContent = '₹0';
        return;
    }
    
    let total = 0;
    container.innerHTML = cart.map((item, idx) => {
        total += item.price * item.qty;
        // Re-sync image from live products if possible
        const liveProduct = allProducts.find(p => p.id === item.id);
        const displayImg = liveProduct ? getProductImage(liveProduct) : item.img;
        
        return `
            <div class="cart-row">
                <img src="${displayImg}" alt="${item.name}">
                <div class="cart-row-info">
                    <div class="cart-row-name">${item.name}</div>
                    <div class="cart-row-detail">${item.brand} • ${item.size}</div>
                    <div class="cart-qty-row">
                        <button class="qty-btn" onclick="window.changeQty(${idx}, -1)">-</button>
                        <span class="qty-num">${item.qty}</span>
                        <button class="qty-btn" onclick="window.changeQty(${idx}, 1)">+</button>
                        <button class="cart-item-del" onclick="window.removeCartItem(${idx})">Remove</button>
                    </div>
                </div>
                <div class="cart-row-price">₹${item.price * item.qty}</div>
            </div>
        `;
    }).join('');
    
    totalEl.textContent = `₹${total}`;
    orderBtn.disabled = false;
}

window.changeQty = function(idx, delta) {
    const cart = JSON.parse(localStorage.getItem('ssp_cart') || '[]');
    cart[idx].qty = Math.max(1, cart[idx].qty + delta);
    localStorage.setItem('ssp_cart', JSON.stringify(cart));
    updateCartBadge();
    renderCartItems();
};

window.removeCartItem = function(idx) {
    const cart = JSON.parse(localStorage.getItem('ssp_cart') || '[]');
    cart.splice(idx, 1);
    localStorage.setItem('ssp_cart', JSON.stringify(cart));
    updateCartBadge();
    renderCartItems();
};

// 23. UI Handlers
function initCartUI() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    
    const openCart = () => { drawer.classList.add('active'); overlay.classList.add('active'); };
    const closeCart = () => { drawer.classList.remove('active'); overlay.classList.remove('active'); };
    
    document.getElementById('cart-nav-btn').addEventListener('click', openCart);
    document.getElementById('cart-fab').addEventListener('click', openCart);
    
    const tabBtn = document.getElementById('cart-tab-btn');
    if (tabBtn) tabBtn.addEventListener('click', openCart);

    document.getElementById('cart-close-btn').addEventListener('click', closeCart);
    overlay.addEventListener('click', closeCart);
    
    document.getElementById('order-wa-btn').addEventListener('click', () => {
        const nameInput = document.getElementById('customer-name');
        const phoneInput = document.getElementById('customer-phone');
        
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        
        if (!name) {
            window.showToast("Please enter your name");
            nameInput.focus();
            return;
        }
        
        if (!phone) {
            window.showToast("Please enter your phone number");
            phoneInput.focus();
            return;
        }

        const cart = JSON.parse(localStorage.getItem('ssp_cart') || '[]');
        const total = document.getElementById('cart-total').textContent;
        
        const msg = buildCartWAMessage(name, phone, cart, total);
        trackWhatsAppClick();
        triggerWhatsApp(SHOP.whatsapp, msg);
    });
}

function buildCartWAMessage(name, phone, items, total) {
    const orderId = '#SSP-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const dateStr = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    const itemsList = items.map((it, i) => {
        const liveProduct = allProducts.find(p => p.id === it.id);
        const imgUrl = liveProduct ? getProductImage(liveProduct) : it.img;
        const finalImg = imgUrl.startsWith('http') ? imgUrl : `${window.location.origin}/${imgUrl.replace(/^\//, '')}`;
        
        return `${i+1}. *${it.name}* (${it.size})
   Qty: ${it.qty} — ₹${it.price * it.qty}
   🔗 Photo: ${finalImg}`;
    }).join('\n\n');

    return `⭐ *SEVEN STAR PERFUME - NEW ORDER* ⭐

📝 *Order ID:* ${orderId}
📅 *Date:* ${dateStr}

👤 *CUSTOMER DETAILS:*
• Name: ${name}
• Phone: ${phone}

📦 *ORDER SUMMARY:*
${itemsList}

━━━━━━━━━━━━━━━━━━
💰 *GRAND TOTAL: ${total}*
━━━━━━━━━━━━━━━━━━

✅ *Method:* Cash on Pickup
✨ Thank you for shopping with Seven Star!
🌐 https://sevenstarperfume.com`;
}

function buildSingleProductWA(p, size) {
    const imgUrl = getProductImage(p);
    // Include full URL if image is relative for WhatsApp preview
    const finalImg = imgUrl.startsWith('http') ? imgUrl : `${window.location.origin}/${imgUrl.replace(/^\//, '')}`;

    return `🌟 *PRODUCT INQUIRY* 🌟

🖼️ *Preview:* ${finalImg}

✨ *Name:* ${p.name}
🏷️ *Brand:* ${p.brand}
📏 *Size:* ${size.label}
💰 *Price:* ₹${size.price}

-----------------------------
🛒 Inquiry via sevenstarperfume.com
📍 Shop: Ahmedabad`;
}

// 27. Toast
window.showToast = function(msg) {
    const t = document.getElementById('toast');
    t.querySelector('span').textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
};

// 28. Floating Hub
function initFloatingHub() {
    const btn = document.getElementById('hub-toggle-btn');
    const panel = document.getElementById('hub-panel');
    const close = document.getElementById('hub-close-btn');
    
    btn.addEventListener('click', () => panel.classList.toggle('open'));
    close.addEventListener('click', () => panel.classList.remove('open'));
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#floating-hub')) panel.classList.remove('open');
    });
}

// 29. WhatsApp Deep-Link Logic
function triggerWhatsApp(phone, message) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const cleanPhone = phone.replace(/\D/g, ''); // Remove any non-digits
    const encodedMsg = encodeURIComponent(message);
    
    if (isMobile) {
        // Force app on mobile using protocol
        window.location.href = `whatsapp://send?phone=${cleanPhone}&text=${encodedMsg}`;
    } else {
        // Desktop uses wa.me or web.whatsapp
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank');
    }
}

// Intercept hardcoded links in HTML for mobile deep-linking
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="wa.me"]');
    if (link && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        e.preventDefault();
        const url = new URL(link.href);
        const phone = url.pathname.replace('/', '');
        const msg = url.searchParams.get('text') || '';
        triggerWhatsApp(phone, msg);
    }
});

// 30. Recently Viewed Logic
function addToRecentViews(id) {
    let recent = JSON.parse(localStorage.getItem('ssp_recent') || '[]');
    recent = recent.filter(pid => pid !== id);
    recent.unshift(id);
    if (recent.length > 8) recent.pop();
    localStorage.setItem('ssp_recent', JSON.stringify(recent));
    renderRecentlyViewed();
}

function renderRecentlyViewed() {
    const recent = JSON.parse(localStorage.getItem('ssp_recent') || '[]');
    const section = document.getElementById('recently-viewed');
    const track = document.getElementById('recent-track');
    if(!section || !track) return;

    if (recent.length === 0) {
        section.style.display = 'none';
        return;
    }

    const items = recent.map(id => allProducts.find(p => p.id === id)).filter(Boolean);
    if (items.length === 0) return;

    section.style.display = 'block';
    track.innerHTML = items.map(p => `
        <div class="featured-card" onclick="window.openModal('${p.id}')">
            <img src="${getProductImage(p)}" class="featured-img" alt="${p.name}">
            <div class="featured-body">
                <div class="f-brand">${p.brand}</div>
                <h3 class="f-name">${p.name}</h3>
                <div class="f-price">₹${p.price}</div>
            </div>
        </div>
    `).join('');
}

function initPWA() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for(let registration of registrations) {
                registration.unregister();
                console.log("Service Worker Unregistered to clear cache");
            }
        });
    }
}

function showInstallButton() {
    if(document.getElementById('pwa-install-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'pwa-install-btn';
    btn.innerHTML = '<i class="ri-download-cloud-line"></i> Install App';
    btn.className = 'nav-wa-btn';
    btn.style.marginLeft = '12px';
    btn.style.background = 'var(--gold)';
    btn.style.color = '#000';
    
    btn.onclick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                btn.style.display = 'none';
            }
            deferredPrompt = null;
        }
    };
    
    const navRight = document.querySelector('.nav-right');
    const navMobile = document.querySelector('.mobile-tab-bar'); // Alternative for mobile
    if(window.innerWidth > 768 && navRight) navRight.insertBefore(btn, navRight.firstChild);
    else if (navMobile) {
        btn.innerHTML = '<i class="ri-download-cloud-line"></i><span>Install</span>';
        btn.className = 'tab-item wa-tab'; // match style
        navMobile.insertBefore(btn, navMobile.firstChild);
    }
}
