require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { nanoid } = require('nanoid');

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
const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return res.status(401).json({ error: 'Missing Authorization header' });

  try {
    const decoded = await admin.auth().verifyIdToken(match[1]);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function formatEntryTime(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api', requireAuth);

app.get('/api/meta', async (req, res) => {
  const snap = await db.collection('meta').doc('constants').get();
  if (!snap.exists) return res.status(404).json({ error: 'Meta not found' });
  res.json(snap.data());
});

app.get('/api/dashboard', async (req, res) => {
  const [entriesSnap, agenciesSnap] = await Promise.all([
    db.collection('entries').orderBy('entryTime', 'desc').limit(50).get(),
    db.collection('agencies').get(),
  ]);

  const travelers = entriesSnap.docs.map((d) => d.data());
  const agencies = agenciesSnap.docs.map((d) => d.data());

  const totalEntries = entriesSnap.size;
  const pending = travelers.filter((t) => t.status === 'PENDING').length;
  const flagged = travelers.filter((t) => t.status === 'FLAGGED').length;
  const online = agencies.filter((a) => a.status === 'online').length;

  const stats = [
    { id: 1, label: 'Total Entries', value: String(totalEntries), change: 'Live', changeType: 'live', icon: '??', color: 'accent' },
    { id: 2, label: 'Pending Review', value: String(pending), change: 'Live', changeType: 'live', icon: '?', color: 'yellow' },
    { id: 3, label: 'Flagged Travelers', value: String(flagged), change: 'Live', changeType: 'live', icon: '??', color: 'red' },
    { id: 4, label: 'Agencies Online', value: String(online), change: 'Live', changeType: 'live', icon: '??', color: 'green' },
  ];

  res.json({ stats, travelers, agencies });
});

app.get('/api/alerts', async (req, res) => {
  const [alertsSnap, agenciesSnap] = await Promise.all([
    db.collection('alerts').orderBy('timestamp', 'desc').limit(50).get(),
    db.collection('agencies').get(),
  ]);

  const alerts = alertsSnap.docs.map((d) => d.data());
  const agencies = agenciesSnap.docs.map((d) => d.data());

  res.json({ alerts, agencies });
});

app.post('/api/alerts/:id/ack', async (req, res) => {
  const { id } = req.params;
  const ref = db.collection('alerts').doc(id);
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ error: 'Alert not found' });

  await ref.set({ acknowledged: true }, { merge: true });
  res.json({ ok: true });
});

app.post('/api/entries', async (req, res) => {
  const {
    fullName,
    gender,
    dob,
    nationality,
    residenceCountry,
    phone,
    email,
    passportNumber,
    passportIssuingCountry,
    passportIssueDate,
    passportExpiryDate,
    visaType,
    visaNumber,
    visaIssuingCountry,
    visaIssueDate,
    visaExpiryDate,
    entryCount,
    destinationCountry,
    portOfEntry,
    arrivalDate,
    departureDate,
    stayDurationDays,
    accommodationType,
    accommodationAddress,
    purposeOfVisit,
    visaDenied,
    deported,
    overstayed,
    countriesVisited,
    criminalRecord,
    checkpoint,
  } = req.body || {};

  if (
    !fullName || !gender || !dob || !nationality || !residenceCountry || !phone || !email ||
    !passportNumber || !passportIssuingCountry || !passportIssueDate || !passportExpiryDate ||
    !visaType || !visaNumber || !visaIssuingCountry || !visaIssueDate || !visaExpiryDate || !entryCount ||
    !destinationCountry || !portOfEntry || !arrivalDate || !departureDate ||
    !stayDurationDays || !accommodationType || !accommodationAddress ||
    !purposeOfVisit || typeof visaDenied !== 'boolean' || typeof deported !== 'boolean' ||
    typeof overstayed !== 'boolean' || !Array.isArray(countriesVisited) || typeof criminalRecord !== 'boolean'
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const entryId = `TRV-${nanoid(6).toUpperCase()}`;
  const entryTime = formatEntryTime();

  const entry = {
    id: entryId,
    name: fullName,
    fullName,
    gender,
    dob,
    nationality,
    residenceCountry,
    phone,
    email,
    passport: passportNumber,
    passportNumber,
    passportIssuingCountry,
    passportIssueDate,
    passportExpiryDate,
    visaType,
    visaNumber,
    visaIssuingCountry,
    visaIssueDate,
    visaExpiryDate,
    entryCount,
    destinationCountry,
    portOfEntry,
    arrivalDate,
    departureDate,
    stayDurationDays,
    accommodationType,
    accommodationAddress,
    purpose: purposeOfVisit,
    purposeOfVisit,
    visaDenied,
    deported,
    overstayed,
    countriesVisited,
    criminalRecord,
    checkpoint: checkpoint || portOfEntry,
    status: 'PENDING',
    entryTime,
  };

  await db.collection('entries').doc(entryId).set(entry);

  res.status(201).json({ entry });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
