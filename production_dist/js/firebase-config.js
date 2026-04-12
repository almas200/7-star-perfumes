import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCnblcEAej7j64BG1JkIlU4p31dX-U6nvE",
  authDomain: "seven-star-perfume.firebaseapp.com",
  projectId: "seven-star-perfume",
  storageBucket: "seven-star-perfume.firebasestorage.app",
  messagingSenderId: "1095381170216",
  appId: "1:1095381170216:web:3cb1fb6d46719458e55d1d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const STORAGE_BUCKET = firebaseConfig.storageBucket;
export const ADMIN_EMAIL = "kavialmas@gmail.com";
export const IMGBB_API_KEY = "5d0286dde4941b79ea99e52afbd0e420";
export const SHOP = {
  whatsapp: "919327409390",
  instagram: "https://www.instagram.com/seven_star_perfume",
  name: "Seven Star Perfume"
};
