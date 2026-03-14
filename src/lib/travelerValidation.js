import { addMonths, diffDaysInclusive, parseDate, startOfToday } from './dateUtils';
import { fieldStepMap } from './travelerForm';

function trimValue(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function isKnownCountry(value, countries) {
  return Array.isArray(countries) && countries.includes(value);
}

function isPositiveInteger(value) {
  return /^[1-9]\d*$/.test(String(value));
}

export function getErrorsForStep(step, data, meta) {
  const next = {};
  const countries = meta.nationalities || [];
  const today = startOfToday();
  const fullName = trimValue(data.fullName);
  const nationality = trimValue(data.nationality);
  const residenceCountry = trimValue(data.residenceCountry);
  const phone = trimValue(data.phone);
  const email = trimValue(data.email);
  const passportNumber = trimValue(data.passportNumber);
  const passportIssuingCountry = trimValue(data.passportIssuingCountry);
  const visaNumber = trimValue(data.visaNumber);
  const visaIssuingCountry = trimValue(data.visaIssuingCountry);
  const destinationCountry = trimValue(data.destinationCountry);
  const accommodationAddress = trimValue(data.accommodationAddress);
  const dob = parseDate(data.dob);
  const passportIssueDate = parseDate(data.passportIssueDate);
  const passportExpiryDate = parseDate(data.passportExpiryDate);
  const visaIssueDate = parseDate(data.visaIssueDate);
  const visaExpiryDate = parseDate(data.visaExpiryDate);
  const arrivalDate = parseDate(data.arrivalDate);
  const departureDate = parseDate(data.departureDate);

  if (step === 0) {
    if (!fullName) next.fullName = 'Required field';
    if (!data.gender) next.gender = 'Required field';
    if (!data.dob) next.dob = 'Required field';
    else if (!dob) next.dob = 'Invalid date';
    else if (dob > today) next.dob = 'Date of birth cannot be in the future';
    if (!nationality) next.nationality = 'Required field';
    else if (!isKnownCountry(nationality, countries)) next.nationality = 'Select a listed country';
    if (!residenceCountry) next.residenceCountry = 'Required field';
    else if (!isKnownCountry(residenceCountry, countries)) next.residenceCountry = 'Select a listed country';
    if (!phone) next.phone = 'Required field';
    else if (!/^[+\d][\d\s()-]{6,19}$/.test(phone)) next.phone = 'Enter a valid phone number';
    if (!email) next.email = 'Required field';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address';
  }

  if (step === 1) {
    if (!passportNumber) next.passportNumber = 'Required field';
    if (!passportIssuingCountry) next.passportIssuingCountry = 'Required field';
    else if (!isKnownCountry(passportIssuingCountry, countries)) next.passportIssuingCountry = 'Select a listed country';
    if (!data.passportIssueDate) next.passportIssueDate = 'Required field';
    else if (!passportIssueDate) next.passportIssueDate = 'Invalid date';
    if (!data.passportExpiryDate) next.passportExpiryDate = 'Required field';
    else if (!passportExpiryDate) next.passportExpiryDate = 'Invalid date';
    if (passportIssueDate && passportExpiryDate && passportIssueDate >= passportExpiryDate) {
      next.passportExpiryDate = 'Expiry must be after issue date';
    }
    if (passportExpiryDate && passportExpiryDate <= today) {
      next.passportExpiryDate = 'Passport must still be valid';
    }
    if (passportExpiryDate && arrivalDate) {
      const minimumValidityDate = addMonths(arrivalDate, 6);
      if (minimumValidityDate && passportExpiryDate < minimumValidityDate) {
        next.passportExpiryDate = 'Must be valid 6 months beyond arrival';
      }
    }
  }

  if (step === 2) {
    if (!data.visaType) next.visaType = 'Required field';
    if (!visaNumber) next.visaNumber = 'Required field';
    if (!visaIssuingCountry) next.visaIssuingCountry = 'Required field';
    else if (!isKnownCountry(visaIssuingCountry, countries)) next.visaIssuingCountry = 'Select a listed country';
    if (!data.visaIssueDate) next.visaIssueDate = 'Required field';
    else if (!visaIssueDate) next.visaIssueDate = 'Invalid date';
    if (!data.visaExpiryDate) next.visaExpiryDate = 'Required field';
    else if (!visaExpiryDate) next.visaExpiryDate = 'Invalid date';
    if (!data.entryCount) next.entryCount = 'Required field';
    if (visaIssueDate && visaExpiryDate && visaIssueDate >= visaExpiryDate) {
      next.visaExpiryDate = 'Expiry must be after issue date';
    }
    if (visaExpiryDate && arrivalDate && visaExpiryDate < arrivalDate) {
      next.visaExpiryDate = 'Visa must be valid on arrival';
    }
    if (visaExpiryDate && departureDate && visaExpiryDate < departureDate) {
      next.visaExpiryDate = 'Visa must be valid through departure';
    }
  }

  if (step === 3) {
    if (!destinationCountry) next.destinationCountry = 'Required field';
    else if (!isKnownCountry(destinationCountry, countries)) next.destinationCountry = 'Select a listed country';
    if (!data.portOfEntry) next.portOfEntry = 'Required field';
    if (!data.arrivalDate) next.arrivalDate = 'Required field';
    else if (!arrivalDate) next.arrivalDate = 'Invalid date';
    if (!data.departureDate) next.departureDate = 'Required field';
    else if (!departureDate) next.departureDate = 'Invalid date';
    if (arrivalDate && departureDate && arrivalDate > departureDate) {
      next.departureDate = 'Departure must be after arrival';
    }
    if (!data.stayDurationDays) next.stayDurationDays = 'Required field';
    else if (!isPositiveInteger(data.stayDurationDays)) next.stayDurationDays = 'Enter a whole number greater than 0';
    if (!data.accommodationType) next.accommodationType = 'Required field';
    if (!accommodationAddress) next.accommodationAddress = 'Required field';
    if (arrivalDate && departureDate && isPositiveInteger(data.stayDurationDays)) {
      const actualStay = diffDaysInclusive(arrivalDate, departureDate);
      if (actualStay !== null && Math.abs(Number(data.stayDurationDays) - actualStay) > 2) {
        next.stayDurationDays = 'Stay duration should align with the travel dates';
      }
    }
  }

  if (step === 4 && !data.purposeOfVisit) {
    next.purposeOfVisit = 'Required field';
  }

  if (step === 5) {
    if (!['true', 'false', true, false].includes(data.visaDenied)) next.visaDenied = 'Select Yes or No';
    if (!['true', 'false', true, false].includes(data.deported)) next.deported = 'Select Yes or No';
    if (!['true', 'false', true, false].includes(data.overstayed)) next.overstayed = 'Select Yes or No';
    if (!['true', 'false', true, false].includes(data.criminalRecord)) next.criminalRecord = 'Select Yes or No';
    if (!Array.isArray(data.countriesVisited)) {
      next.countriesVisited = 'Invalid value';
    }
  }

  return next;
}

export function getAllErrors(data, meta) {
  return Object.assign(
    {},
    getErrorsForStep(0, data, meta),
    getErrorsForStep(1, data, meta),
    getErrorsForStep(2, data, meta),
    getErrorsForStep(3, data, meta),
    getErrorsForStep(4, data, meta),
    getErrorsForStep(5, data, meta),
  );
}

export function getFirstErrorStep(fieldErrors) {
  const steps = Object.keys(fieldErrors)
    .map((field) => fieldStepMap[field])
    .filter((value) => typeof value === 'number');
  return steps.length ? Math.min(...steps) : 0;
}
