import { readFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultKeyPath = resolve(__dirname, 'serviceAccountKey.json');
const keyPath = process.env.SERVICE_ACCOUNT_PATH ? resolve(process.env.SERVICE_ACCOUNT_PATH) : defaultKeyPath;
const dataPath = resolve(__dirname, 'bulk_upload_p7_p24.json');

if (!existsSync(keyPath)) {
  console.error(`Service account key not found at: ${keyPath}`);
  console.error('Provide the file at this path, or set SERVICE_ACCOUNT_PATH to the service account JSON.');
  process.exit(1);
}

if (!existsSync(dataPath)) {
  console.error(`Data file not found at: ${dataPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf-8'));
const products = JSON.parse(readFileSync(dataPath, 'utf-8'));

if (!Array.isArray(products)) {
  console.error('Expected bulk_upload_p7_p24.json to contain an array of products.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function uploadProducts() {
  console.log(`Uploading ${products.length} products to Firestore...`);
  for (const [index, product] of products.entries()) {
    const docRef = await db.collection('products').add({ ...product, updatedAt: new Date().toISOString() });
    console.log(`✅ [${index + 1}/${products.length}] ${product.name} -> ${docRef.id}`);
  }
  console.log('🎉 Upload complete.');
}

uploadProducts().catch((err) => {
  console.error('Upload failed:', err);
  process.exit(1);
});