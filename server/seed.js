require('dotenv').config();
const admin = require('firebase-admin');
const { readFileSync } = require('fs');
const path = require('path');

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error('Missing Firebase Admin env vars. See .env.example');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

const seedPath = path.join(__dirname, 'seed-data.json');
const seed = JSON.parse(readFileSync(seedPath, 'utf-8'));

async function upsertCollection(collectionName, items, idField = 'id') {
  const batch = db.batch();
  items.forEach((item) => {
    const id = String(item[idField] ?? db.collection(collectionName).doc().id);
    const ref = db.collection(collectionName).doc(id);
    batch.set(ref, item, { merge: true });
  });
  await batch.commit();
}

async function run() {
  await upsertCollection('entries', seed.travelers, 'id');
  await upsertCollection('alerts', seed.alerts, 'id');
  await upsertCollection('agencies', seed.agencies, 'id');
  await db.collection('meta').doc('constants').set({
    visaTypes: seed.visaTypes,
    nationalities: seed.nationalities,
    checkpoints: seed.checkpoints,
    genders: seed.genders,
    portOfEntryTypes: seed.portOfEntryTypes,
    accommodationTypes: seed.accommodationTypes,
    purposeOfVisitOptions: seed.purposeOfVisitOptions,
    entryCounts: seed.entryCounts,
  }, { merge: true });

  console.log('Seed complete.');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
