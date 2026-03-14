export const emptyMeta = {
  nationalities: [],
  visaTypes: [],
  checkpoints: [],
  genders: ['Male', 'Female', 'Other'],
  portOfEntryTypes: ['Airport', 'Land Border', 'Seaport'],
  accommodationTypes: ['Hotel', 'Host', 'Rental', 'Other'],
  purposeOfVisitOptions: ['Tourism', 'Work', 'Study', 'Business', 'Family Visit', 'Transit'],
  entryCounts: ['Single Entry', 'Multiple Entry'],
};

export const stepLabels = [
  'Identity',
  'Passport',
  'Visa',
  'Travel',
  'Purpose',
  'History',
  'Review',
];

export const initialFormState = {
  fullName: '',
  gender: '',
  dob: '',
  nationality: '',
  residenceCountry: '',
  phone: '',
  email: '',
  passportNumber: '',
  passportIssuingCountry: '',
  passportIssueDate: '',
  passportExpiryDate: '',
  visaType: '',
  visaNumber: '',
  visaIssuingCountry: '',
  visaIssueDate: '',
  visaExpiryDate: '',
  entryCount: '',
  destinationCountry: '',
  portOfEntry: '',
  arrivalDate: '',
  departureDate: '',
  stayDurationDays: '',
  accommodationType: '',
  accommodationAddress: '',
  purposeOfVisit: '',
  visaDenied: '',
  deported: '',
  overstayed: '',
  countriesVisited: [],
  criminalRecord: '',
};

export const fieldStepMap = {
  fullName: 0,
  gender: 0,
  dob: 0,
  nationality: 0,
  residenceCountry: 0,
  phone: 0,
  email: 0,
  passportNumber: 1,
  passportIssuingCountry: 1,
  passportIssueDate: 1,
  passportExpiryDate: 1,
  visaType: 2,
  visaNumber: 2,
  visaIssuingCountry: 2,
  visaIssueDate: 2,
  visaExpiryDate: 2,
  entryCount: 2,
  destinationCountry: 3,
  portOfEntry: 3,
  arrivalDate: 3,
  departureDate: 3,
  stayDurationDays: 3,
  accommodationType: 3,
  accommodationAddress: 3,
  purposeOfVisit: 4,
  visaDenied: 5,
  deported: 5,
  overstayed: 5,
  countriesVisited: 5,
  criminalRecord: 5,
};

export const fieldLabels = {
  fullName: 'Full Legal Name',
  gender: 'Gender',
  dob: 'Date of Birth',
  nationality: 'Nationality',
  residenceCountry: 'Country of Residence',
  phone: 'Phone Number',
  email: 'Email Address',
  passportNumber: 'Passport Number',
  passportIssuingCountry: 'Passport Issuing Country',
  passportIssueDate: 'Passport Issue Date',
  passportExpiryDate: 'Passport Expiry Date',
  visaType: 'Visa Type',
  visaNumber: 'Visa Number',
  visaIssuingCountry: 'Visa Issuing Country',
  visaIssueDate: 'Visa Issue Date',
  visaExpiryDate: 'Visa Expiry Date',
  entryCount: 'Number of Entries',
  destinationCountry: 'Destination Country',
  portOfEntry: 'Port of Entry',
  arrivalDate: 'Arrival Date',
  departureDate: 'Departure Date',
  stayDurationDays: 'Intended Stay Duration',
  accommodationType: 'Accommodation Type',
  accommodationAddress: 'Accommodation Address',
  purposeOfVisit: 'Purpose of Visit',
  visaDenied: 'Previous Visa Denial',
  deported: 'Previous Deportation',
  overstayed: 'Previous Visa Overstay',
  countriesVisited: 'Countries Visited in the Last 5 Years',
  criminalRecord: 'Criminal Record',
};

export function normalizeMeta(data = {}) {
  return {
    nationalities: data.nationalities || emptyMeta.nationalities,
    visaTypes: data.visaTypes?.filter((value) =>
      ['Tourist', 'Work', 'Study', 'Business', 'Transit', 'Refugee'].includes(value)
    ) || ['Tourist', 'Work', 'Study', 'Business', 'Transit', 'Refugee'],
    checkpoints: data.checkpoints || emptyMeta.checkpoints,
    genders: data.genders || emptyMeta.genders,
    portOfEntryTypes: data.portOfEntryTypes || emptyMeta.portOfEntryTypes,
    accommodationTypes: data.accommodationTypes || emptyMeta.accommodationTypes,
    purposeOfVisitOptions: data.purposeOfVisitOptions || emptyMeta.purposeOfVisitOptions,
    entryCounts: data.entryCounts || emptyMeta.entryCounts,
  };
}

export function toSubmissionPayload(form) {
  return {
    ...form,
    fullName: typeof form.fullName === 'string' ? form.fullName.trim() : form.fullName,
    nationality: typeof form.nationality === 'string' ? form.nationality.trim() : form.nationality,
    residenceCountry: typeof form.residenceCountry === 'string' ? form.residenceCountry.trim() : form.residenceCountry,
    phone: typeof form.phone === 'string' ? form.phone.trim() : form.phone,
    email: typeof form.email === 'string' ? form.email.trim() : form.email,
    passportNumber: typeof form.passportNumber === 'string' ? form.passportNumber.trim() : form.passportNumber,
    passportIssuingCountry: typeof form.passportIssuingCountry === 'string' ? form.passportIssuingCountry.trim() : form.passportIssuingCountry,
    visaNumber: typeof form.visaNumber === 'string' ? form.visaNumber.trim() : form.visaNumber,
    visaIssuingCountry: typeof form.visaIssuingCountry === 'string' ? form.visaIssuingCountry.trim() : form.visaIssuingCountry,
    destinationCountry: typeof form.destinationCountry === 'string' ? form.destinationCountry.trim() : form.destinationCountry,
    accommodationAddress: typeof form.accommodationAddress === 'string' ? form.accommodationAddress.trim() : form.accommodationAddress,
    stayDurationDays: Number(form.stayDurationDays),
    visaDenied: form.visaDenied === true || form.visaDenied === 'true',
    deported: form.deported === true || form.deported === 'true',
    overstayed: form.overstayed === true || form.overstayed === 'true',
    criminalRecord: form.criminalRecord === true || form.criminalRecord === 'true',
  };
}

export function formatFieldValue(field, value) {
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === '' || value === null || value === undefined) return '-';
  if (field === 'stayDurationDays') return `${value} days`;
  return String(value);
}
