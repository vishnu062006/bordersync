import { addMonths, diffDaysInclusive, parseDate } from './dateUtils';
import { emptyMeta, fieldLabels } from './travelerForm';
import { getAllErrors } from './travelerValidation';

export const RISK_WEIGHTS = {
  passportVisa: 0.3,
  travelConsistency: 0.2,
  immigrationHistory: 0.3,
  tripPlausibility: 0.1,
  dataIntegrity: 0.1,
};

const riskBands = [
  { min: 0, max: 20, label: 'Low Risk', action: 'Normal processing', tone: 'green' },
  { min: 21, max: 40, label: 'Mild Risk', action: 'Standard review', tone: 'amber' },
  { min: 41, max: 60, label: 'Moderate Risk', action: 'Enhanced review', tone: 'yellow' },
  { min: 61, max: 80, label: 'High Risk', action: 'Manual review required', tone: 'orange' },
  { min: 81, max: 100, label: 'Critical Risk', action: 'Escalate / hold', tone: 'red' },
];

const visaPurposeMatrix = {
  Tourist: ['Tourism', 'Family Visit'],
  Work: ['Work', 'Business'],
  Study: ['Study'],
  Business: ['Business'],
  Transit: ['Transit'],
  Refugee: ['Family Visit', 'Transit'],
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function createRuleState() {
  return { score: 0, reasons: [], warnings: [] };
}

function addPenalty(state, points, reason, warning) {
  state.score += points;
  if (reason) state.reasons.push(reason);
  if (warning) state.warnings.push(warning);
}

function normalizeCategory(category) {
  return clamp(Math.round(category.score));
}

function getRiskBand(score) {
  return riskBands.find((band) => score >= band.min && score <= band.max) || riskBands[0];
}

function dedupe(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

function getWeakAccommodation(address) {
  const trimmed = typeof address === 'string' ? address.trim() : '';
  if (!trimmed) return true;
  return trimmed.length < 10 || (/^[a-z0-9\s]+$/i.test(trimmed) && trimmed.split(/\s+/).length < 3);
}

export function evaluateTravelerRisk(formData, meta = emptyMeta) {
  const data = { ...formData };
  const passportIssueDate = parseDate(data.passportIssueDate);
  const passportExpiryDate = parseDate(data.passportExpiryDate);
  const visaIssueDate = parseDate(data.visaIssueDate);
  const visaExpiryDate = parseDate(data.visaExpiryDate);
  const arrivalDate = parseDate(data.arrivalDate);
  const departureDate = parseDate(data.departureDate);
  const actualStay = diffDaysInclusive(arrivalDate, departureDate);
  const requestedStay = Number(data.stayDurationDays);
  const validationErrors = getAllErrors(data, meta);

  const passportVisa = createRuleState();
  const travelConsistency = createRuleState();
  const immigrationHistory = createRuleState();
  const tripPlausibility = createRuleState();
  const dataIntegrity = createRuleState();

  if (!passportExpiryDate || (arrivalDate && passportExpiryDate < arrivalDate)) {
    addPenalty(passportVisa, 95, 'Passport is expired or becomes invalid before arrival.', 'Passport validity requirement not satisfied.');
  }
  if (passportIssueDate && passportExpiryDate && passportIssueDate >= passportExpiryDate) {
    addPenalty(passportVisa, 100, 'Passport issue date is after the passport expiry date.', 'Passport dates are internally inconsistent.');
  }
  if (passportExpiryDate && arrivalDate) {
    const minimumPassportValidity = addMonths(arrivalDate, 6);
    if (minimumPassportValidity && passportExpiryDate < minimumPassportValidity) {
      addPenalty(passportVisa, 70, 'Passport is not valid for 6 months beyond the arrival date.', 'Passport validity requirement not satisfied.');
    }
  }
  if (!visaExpiryDate || (arrivalDate && visaExpiryDate < arrivalDate) || (departureDate && visaExpiryDate < departureDate)) {
    addPenalty(passportVisa, 95, 'Visa is not valid for the declared travel dates.', 'Visa validity requirement not satisfied.');
  }
  if (visaIssueDate && visaExpiryDate && visaIssueDate >= visaExpiryDate) {
    addPenalty(passportVisa, 100, 'Visa issue date is after the visa expiry date.', 'Visa dates are internally inconsistent.');
  }
  if (data.visaType && data.purposeOfVisit) {
    const allowedPurposes = visaPurposeMatrix[data.visaType] || [];
    if (allowedPurposes.length > 0 && !allowedPurposes.includes(data.purposeOfVisit)) {
      addPenalty(passportVisa, 45, 'Visa type does not match the declared purpose of visit.', 'Visa and purpose of visit should be reviewed together.');
    }
  }
  if (data.entryCount === 'Single Entry' && Array.isArray(data.countriesVisited) && data.countriesVisited.length >= 8) {
    addPenalty(passportVisa, 15, 'Single-entry visa is paired with a travel history pattern that merits review.');
  }

  if (arrivalDate && departureDate && arrivalDate > departureDate) {
    addPenalty(travelConsistency, 100, 'Arrival date is after the departure date.', 'Travel dates are not chronologically valid.');
  }
  if (actualStay !== null && Number.isFinite(requestedStay) && requestedStay > 0) {
    const delta = Math.abs(actualStay - requestedStay);
    if (delta >= 10) addPenalty(travelConsistency, 40, 'Declared stay duration does not match the arrival and departure dates.');
    else if (delta >= 3) addPenalty(travelConsistency, 20, 'Declared stay duration is slightly inconsistent with the travel dates.');
  }
  if (!data.portOfEntry) {
    addPenalty(travelConsistency, 15, 'Port of entry is missing from the travel declaration.');
  }
  if (getWeakAccommodation(data.accommodationAddress)) {
    addPenalty(travelConsistency, 20, 'Accommodation details are incomplete or too vague for travel review.');
  }
  if (visaExpiryDate && departureDate && visaExpiryDate < departureDate) {
    addPenalty(travelConsistency, 40, 'Departure date extends beyond visa validity.', 'Travel dates exceed visa validity.');
  }

  if (data.visaDenied) addPenalty(immigrationHistory, 30, 'Traveler has a prior visa denial history.');
  if (data.deported) addPenalty(immigrationHistory, 85, 'Traveler has a prior deportation history.', 'Prior deportation requires senior review.');
  if (data.overstayed) addPenalty(immigrationHistory, 55, 'Traveler has a prior visa overstay history.');
  if (data.criminalRecord) addPenalty(immigrationHistory, 90, 'Traveler has a declared criminal record.', 'Criminal record requires immediate escalation.');

  if (data.purposeOfVisit === 'Transit' && Number.isFinite(requestedStay) && requestedStay > 3) {
    addPenalty(tripPlausibility, 55, 'Transit travel is paired with an unusually long stay duration.');
  }
  if (data.purposeOfVisit === 'Tourism' && Number.isFinite(requestedStay) && requestedStay > 45) {
    addPenalty(tripPlausibility, 35, 'Tourism trip duration is unusually long and should be confirmed.');
  }
  if (data.purposeOfVisit === 'Study' && Number.isFinite(requestedStay) && requestedStay < 14) {
    addPenalty(tripPlausibility, 40, 'Study purpose is paired with an unusually short stay.');
  }
  if (data.purposeOfVisit === 'Business' && Number.isFinite(requestedStay) && requestedStay > 30) {
    addPenalty(tripPlausibility, 30, 'Business travel duration is long enough to require additional context.');
  }
  if (data.purposeOfVisit === 'Family Visit' && data.accommodationType === 'Hotel') {
    addPenalty(tripPlausibility, 15, 'Family visit declaration does not clearly align with the stated accommodation type.');
  }

  const requiredWarnings = Object.entries(validationErrors).map(([field, message]) => {
    const label = fieldLabels[field] || field;
    return `${label}: ${message}`;
  });
  if (requiredWarnings.length > 0) {
    addPenalty(dataIntegrity, Math.min(100, requiredWarnings.length * 18), 'Structured data contains validation or completeness issues.');
    dataIntegrity.warnings.push(...requiredWarnings);
  }
  if (getWeakAccommodation(data.accommodationAddress)) {
    addPenalty(dataIntegrity, 20, 'Accommodation address appears incomplete.', 'Accommodation address should be verified.');
  }
  if (data.phone && !/^[+\d][\d\s()-]{6,19}$/.test(String(data.phone).trim())) {
    addPenalty(dataIntegrity, 25, 'Phone number format is invalid.', 'Phone number should be corrected before processing.');
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email).trim())) {
    addPenalty(dataIntegrity, 25, 'Email address format is invalid.', 'Email address should be corrected before processing.');
  }

  const breakdown = {
    passportVisa: normalizeCategory(passportVisa),
    travelConsistency: normalizeCategory(travelConsistency),
    immigrationHistory: normalizeCategory(immigrationHistory),
    tripPlausibility: normalizeCategory(tripPlausibility),
    dataIntegrity: normalizeCategory(dataIntegrity),
  };

  const overallRisk = Math.round(
    breakdown.passportVisa * RISK_WEIGHTS.passportVisa +
    breakdown.travelConsistency * RISK_WEIGHTS.travelConsistency +
    breakdown.immigrationHistory * RISK_WEIGHTS.immigrationHistory +
    breakdown.tripPlausibility * RISK_WEIGHTS.tripPlausibility +
    breakdown.dataIntegrity * RISK_WEIGHTS.dataIntegrity
  );
  const band = getRiskBand(overallRisk);
  const reasons = dedupe([
    ...passportVisa.reasons,
    ...travelConsistency.reasons,
    ...immigrationHistory.reasons,
    ...tripPlausibility.reasons,
    ...dataIntegrity.reasons,
  ]).slice(0, 8);
  const warnings = dedupe([
    ...passportVisa.warnings,
    ...travelConsistency.warnings,
    ...immigrationHistory.warnings,
    ...tripPlausibility.warnings,
    ...dataIntegrity.warnings,
  ]);

  return {
    overallRisk,
    riskBand: band.label,
    recommendedAction: band.action,
    tone: band.tone,
    weights: RISK_WEIGHTS,
    breakdown,
    reasons,
    warnings,
  };
}
