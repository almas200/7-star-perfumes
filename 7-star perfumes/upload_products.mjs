// Bulk upload script for p7-p24
// Run: node upload_products.mjs

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { readFileSync } from "fs";

const firebaseConfig = {
    apiKey: "AIzaSyCnblcEAej7j64BG1JkIlU4p31dX-U6nvE",
    authDomain: "seven-star-perfume.firebaseapp.com",
    projectId: "seven-star-perfume",
    storageBucket: "seven-star-perfume.firebasestorage.app",
    messagingSenderId: "1095381170216",
    appId: "1:1095381170216:web:3cb1fb6d46719458e55d1d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const products = JSON.parse(readFileSync('./bulk_upload_p7_p24.json', 'utf8'));

async function upload() {
    console.log(`Uploading ${products.length} products...`);
    for (const p of products) {
        const docRef = await addDoc(collection(db, 'products'), {
            ...p,
            updatedAt: new Date().toISOString()
        });
        console.log(`✅ Added: ${p.name} (${docRef.id})`);
    }
    console.log("🎉 All products uploaded!");
    process.exit(0);
}

upload().catch(e => { console.error(e); process.exit(1); });
