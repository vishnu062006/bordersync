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
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function formatEntryTime(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDate(value) {
  if (!value || typeof value !== 'string') return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function trimValue(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function addFieldError(errors, field, message) {
  if (!errors[field]) errors[field] = message;
}

function validateEntryPayload(payload, meta = {}) {
  const errors = {};
  const countries = Array.isArray(meta.nationalities) ? meta.nationalities : [];
  const genders = Array.isArray(meta.genders) ? meta.genders : [];
  const visaTypes = Array.isArray(meta.visaTypes) ? meta.visaTypes : [];
  const portOfEntryTypes = Array.isArray(meta.portOfEntryTypes) ? meta.portOfEntryTypes : [];
  const accommodationTypes = Array.isArray(meta.accommodationTypes) ? meta.accommodationTypes : [];
  const purposeOptions = Array.isArray(meta.purposeOfVisitOptions) ? meta.purposeOfVisitOptions : [];
  const entryCounts = Array.isArray(meta.entryCounts) ? meta.entryCounts : [];

  const fullName = trimValue(payload.fullName);
  const nationality = trimValue(payload.nationality);
  const residenceCountry = trimValue(payload.residenceCountry);
  const phone = trimValue(payload.phone);
  const email = trimValue(payload.email);
  const passportNumber = trimValue(payload.passportNumber);
  const passportIssuingCountry = trimValue(payload.passportIssuingCountry);
  const visaNumber = trimValue(payload.visaNumber);
  const visaIssuingCountry = trimValue(payload.visaIssuingCountry);
  const destinationCountry = trimValue(payload.destinationCountry);
  const accommodationAddress = trimValue(payload.accommodationAddress);
  const stayDurationDays = Number(payload.stayDurationDays);
  const arrivalDate = parseDate(payload.arrivalDate);
  const departureDate = parseDate(payload.departureDate);
  const passportIssueDate = parseDate(payload.passportIssueDate);
  const passportExpiryDate = parseDate(payload.passportExpiryDate);
  const visaIssueDate = parseDate(payload.visaIssueDate);
  const visaExpiryDate = parseDate(payload.visaExpiryDate);
  const dob = parseDate(payload.dob);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!fullName) addFieldError(errors, 'fullName', 'Required field');
  if (!payload.gender) addFieldError(errors, 'gender', 'Required field');
  else if (genders.length > 0 && !genders.includes(payload.gender)) addFieldError(errors, 'gender', 'Select a valid option');
  if (!payload.dob) addFieldError(errors, 'dob', 'Required field');
  else if (!dob) addFieldError(errors, 'dob', 'Invalid date');
  else if (dob > today) addFieldError(errors, 'dob', 'Date of birth cannot be in the future');

  if (!nationality) addFieldError(errors, 'nationality', 'Required field');
  else if (countries.length > 0 && !countries.includes(nationality)) addFieldError(errors, 'nationality', 'Select a listed country');
  if (!residenceCountry) addFieldError(errors, 'residenceCountry', 'Required field');
  else if (countries.length > 0 && !countries.includes(residenceCountry)) addFieldError(errors, 'residenceCountry', 'Select a listed country');
  if (!phone) addFieldError(errors, 'phone', 'Required field');
  else if (!/^[+\d][\d\s()-]{6,19}$/.test(phone)) addFieldError(errors, 'phone', 'Enter a valid phone number');
  if (!email) addFieldError(errors, 'email', 'Required field');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) addFieldError(errors, 'email', 'Enter a valid email address');

  if (!passportNumber) addFieldError(errors, 'passportNumber', 'Required field');
  if (!passportIssuingCountry) addFieldError(errors, 'passportIssuingCountry', 'Required field');
  else if (countries.length > 0 && !countries.includes(passportIssuingCountry)) addFieldError(errors, 'passportIssuingCountry', 'Select a listed country');
  if (!payload.passportIssueDate) addFieldError(errors, 'passportIssueDate', 'Required field');
  else if (!passportIssueDate) addFieldError(errors, 'passportIssueDate', 'Invalid date');
  if (!payload.passportExpiryDate) addFieldError(errors, 'passportExpiryDate', 'Required field');
  else if (!passportExpiryDate) addFieldError(errors, 'passportExpiryDate', 'Invalid date');
  if (passportIssueDate && passportExpiryDate && passportIssueDate >= passportExpiryDate) {
    addFieldError(errors, 'passportExpiryDate', 'Expiry must be after issue date');
  }
  if (passportExpiryDate && passportExpiryDate <= today) {
    addFieldError(errors, 'passportExpiryDate', 'Passport must still be valid');
  }

  if (!payload.visaType) addFieldError(errors, 'visaType', 'Required field');
  else if (visaTypes.length > 0 && !visaTypes.includes(payload.visaType)) addFieldError(errors, 'visaType', 'Select a valid option');
  if (!visaNumber) addFieldError(errors, 'visaNumber', 'Required field');
  if (!visaIssuingCountry) addFieldError(errors, 'visaIssuingCountry', 'Required field');
  else if (countries.length > 0 && !countries.includes(visaIssuingCountry)) addFieldError(errors, 'visaIssuingCountry', 'Select a listed country');
  if (!payload.visaIssueDate) addFieldError(errors, 'visaIssueDate', 'Required field');
  else if (!visaIssueDate) addFieldError(errors, 'visaIssueDate', 'Invalid date');
  if (!payload.visaExpiryDate) addFieldError(errors, 'visaExpiryDate', 'Required field');
  else if (!visaExpiryDate) addFieldError(errors, 'visaExpiryDate', 'Invalid date');
  if (!payload.entryCount) addFieldError(errors, 'entryCount', 'Required field');
  else if (entryCounts.length > 0 && !entryCounts.includes(payload.entryCount)) addFieldError(errors, 'entryCount', 'Select a valid option');
  if (visaIssueDate && visaExpiryDate && visaIssueDate >= visaExpiryDate) {
    addFieldError(errors, 'visaExpiryDate', 'Expiry must be after issue date');
  }

  if (!destinationCountry) addFieldError(errors, 'destinationCountry', 'Required field');
  else if (countries.length > 0 && !countries.includes(destinationCountry)) addFieldError(errors, 'destinationCountry', 'Select a listed country');
  if (!payload.portOfEntry) addFieldError(errors, 'portOfEntry', 'Required field');
  else if (portOfEntryTypes.length > 0 && !portOfEntryTypes.includes(payload.portOfEntry)) addFieldError(errors, 'portOfEntry', 'Select a valid option');
  if (!payload.arrivalDate) addFieldError(errors, 'arrivalDate', 'Required field');
  else if (!arrivalDate) addFieldError(errors, 'arrivalDate', 'Invalid date');
  if (!payload.departureDate) addFieldError(errors, 'departureDate', 'Required field');
  else if (!departureDate) addFieldError(errors, 'departureDate', 'Invalid date');
  if (arrivalDate && departureDate && arrivalDate > departureDate) {
    addFieldError(errors, 'departureDate', 'Departure must be after arrival');
  }

  if (!Number.isInteger(stayDurationDays) || stayDurationDays <= 0) {
    addFieldError(errors, 'stayDurationDays', 'Enter a whole number greater than 0');
  }
  if (!payload.accommodationType) addFieldError(errors, 'accommodationType', 'Required field');
  else if (accommodationTypes.length > 0 && !accommodationTypes.includes(payload.accommodationType)) addFieldError(errors, 'accommodationType', 'Select a valid option');
  if (!accommodationAddress) addFieldError(errors, 'accommodationAddress', 'Required field');
  if (!payload.purposeOfVisit) addFieldError(errors, 'purposeOfVisit', 'Required field');
  else if (purposeOptions.length > 0 && !purposeOptions.includes(payload.purposeOfVisit)) addFieldError(errors, 'purposeOfVisit', 'Select a valid option');

  if (typeof payload.visaDenied !== 'boolean') addFieldError(errors, 'visaDenied', 'Select Yes or No');
  if (typeof payload.deported !== 'boolean') addFieldError(errors, 'deported', 'Select Yes or No');
  if (typeof payload.overstayed !== 'boolean') addFieldError(errors, 'overstayed', 'Select Yes or No');
  if (typeof payload.criminalRecord !== 'boolean') addFieldError(errors, 'criminalRecord', 'Select Yes or No');
  if (!Array.isArray(payload.countriesVisited) || payload.countriesVisited.length === 0) {
    addFieldError(errors, 'countriesVisited', 'Select at least one country');
  }

  if (Array.isArray(payload.countriesVisited) && countries.length > 0) {
    const invalidVisited = payload.countriesVisited.some((country) => !countries.includes(country));
    if (invalidVisited) addFieldError(errors, 'countriesVisited', 'Select only listed countries');
  }

  if (passportExpiryDate && arrivalDate) {
    const sixMonthsLater = new Date(arrivalDate);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    if (passportExpiryDate < sixMonthsLater) {
      addFieldError(errors, 'passportExpiryDate', 'Must be valid 6 months beyond arrival');
    }
  }
  if (visaExpiryDate && arrivalDate && visaExpiryDate < arrivalDate) {
    addFieldError(errors, 'visaExpiryDate', 'Visa must be valid on arrival');
  }
  if (visaExpiryDate && departureDate && visaExpiryDate < departureDate) {
    addFieldError(errors, 'visaExpiryDate', 'Visa must be valid through departure');
  }

  return {
    errors,
    sanitized: {
      ...payload,
      fullName,
      nationality,
      residenceCountry,
      phone,
      email,
      passportNumber,
      passportIssuingCountry,
      visaNumber,
      visaIssuingCountry,
      destinationCountry,
      accommodationAddress,
      stayDurationDays,
    },
  };
}

function getFlaggedAlert(entry) {
  if (entry.criminalRecord) {
    return {
      type: 'WATCHLIST_HIT',
      severity: 'CRITICAL',
      message: 'Traveler self-reported a criminal record. Immediate secondary screening required.',
      agency: 'International Liaison Unit',
    };
  }

  if (entry.deported) {
    return {
      type: 'WATCHLIST_HIT',
      severity: 'HIGH',
      message: 'Traveler reported a prior deportation. Escalate to border security for review.',
      agency: 'Border Security Division',
    };
  }

  if (entry.overstayed) {
    return {
      type: 'OVERSTAY_RISK',
      severity: 'MEDIUM',
      message: 'Travel history indicates a previous visa overstay. Immigration analytics review required.',
      agency: 'Immigration Analytics',
    };
  }

  if (entry.visaDenied) {
    return {
      type: 'VISA_ANOMALY',
      severity: 'MEDIUM',
      message: 'Traveler reported a previous visa denial. Visa credentials require manual verification.',
      agency: 'Diplomatic Affairs Bureau',
    };
  }

  return null;
}

function buildAlertForEntry(entry, existingAlertId) {
  const alertDetails = getFlaggedAlert(entry) || {
    type: 'DOCUMENT_MISMATCH',
    severity: 'HIGH',
    message: 'Traveler has been flagged for manual review. Secondary screening required.',
    agency: 'Border Security Division',
  };

  return {
    id: existingAlertId || `ALT-${entry.id}`,
    travelerId: entry.id,
    travelerName: entry.fullName || entry.name,
    nationality: entry.nationality,
    type: alertDetails.type,
    severity: alertDetails.severity,
    message: alertDetails.message,
    timestamp: entry.entryTime || formatEntryTime(),
    agency: alertDetails.agency,
    acknowledged: false,
  };
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
  const [alertsSnap, agenciesSnap, entriesSnap] = await Promise.all([
    db.collection('alerts').orderBy('timestamp', 'desc').limit(50).get(),
    db.collection('agencies').get(),
    db.collection('entries').where('status', '==', 'FLAGGED').get(),
  ]);

  const alerts = alertsSnap.docs.map((d) => d.data());
  const agencies = agenciesSnap.docs.map((d) => d.data());
  const flaggedEntries = entriesSnap.docs.map((d) => d.data());
  const alertsByTravelerId = new Map(alerts.map((alert) => [alert.travelerId, alert]));
  const missingAlerts = flaggedEntries
    .filter((entry) => !alertsByTravelerId.has(entry.id))
    .map((entry) => buildAlertForEntry(entry));

  if (missingAlerts.length > 0) {
    const batch = db.batch();
    missingAlerts.forEach((alert) => {
      batch.set(db.collection('alerts').doc(alert.id), alert, { merge: true });
    });
    await batch.commit();
  }

  const allAlerts = [...alerts, ...missingAlerts]
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
    .slice(0, 50);

  res.json({ alerts: allAlerts, agencies });
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
  const metaSnap = await db.collection('meta').doc('constants').get();
  const meta = metaSnap.exists ? metaSnap.data() : {};
  const { errors, sanitized } = validateEntryPayload(req.body || {}, meta);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Validation failed', fields: errors });
  }

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
  } = sanitized;

  const entryId = `TRV-${nanoid(6).toUpperCase()}`;
  const entryTime = formatEntryTime();
  const alertDetails = getFlaggedAlert(sanitized);
  const status = alertDetails ? 'FLAGGED' : 'PENDING';

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
    status,
    entryTime,
  };

  await db.collection('entries').doc(entryId).set(entry);

  if (status === 'FLAGGED' && alertDetails) {
    const alert = buildAlertForEntry(entry, `ALT-${entryId}`);
    await db.collection('alerts').doc(alert.id).set(alert);
  }

  res.status(201).json({ entry });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
