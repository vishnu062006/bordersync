import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const emptyMeta = {
  nationalities: [],
  visaTypes: [],
  checkpoints: [],
  genders: [],
  portOfEntryTypes: [],
  accommodationTypes: [],
  purposeOfVisitOptions: [],
  entryCounts: [],
};

const stepLabels = [
  'Identity',
  'Passport',
  'Visa',
  'Travel',
  'Stay',
  'Purpose',
  'History',
  'Review',
];

const initialFormState = {
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

const fieldStepMap = {
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
  stayDurationDays: 4,
  accommodationType: 4,
  accommodationAddress: 4,
  purposeOfVisit: 5,
  visaDenied: 6,
  deported: 6,
  overstayed: 6,
  countriesVisited: 6,
  criminalRecord: 6,
};

function ProgressBar({ step, onStepSelect }) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        {stepLabels.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onStepSelect(i)}
              className="flex items-center gap-2 rounded-xl transition-all duration-300"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500"
                style={{
                  background:
                    i < step
                      ? 'linear-gradient(135deg, #E85D1A, #FF7A3D)'
                      : i === step
                      ? 'rgba(232, 93, 26, 0.15)'
                      : 'rgba(255,255,255,0.05)',
                  color: i <= step ? '#fff' : '#6B7280',
                  border: i === step ? '2px solid #E85D1A' : '2px solid transparent',
                  boxShadow: i < step ? '0 0 15px rgba(232, 93, 26, 0.3)' : 'none',
                }}
              >
                {i < step ? 'OK' : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:inline ${i <= step ? 'text-white' : 'text-gray-600'}`}>
                {s}
              </span>
            </button>
          </div>
        ))}
      </div>
      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${(step / (stepLabels.length - 1)) * 100}%`,
            background: 'linear-gradient(90deg, #E85D1A, #FF7A3D)',
            boxShadow: '0 0 10px rgba(232, 93, 26, 0.4)',
          }}
        />
      </div>
    </div>
  );
}


function FloatingInput({ label, name, value, onChange, type = 'text', required = true, error }) {
  return (
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder=" "
        required={required}
        className="glass-input peer pt-6"
        style={{ background: 'rgba(15, 23, 42, 0.6)' }}
      />
      <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none transition-all duration-300 peer-focus:top-3 peer-focus:text-[10px] peer-focus:text-accent peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wider peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-accent peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-wider">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {error && <div className="mt-1 text-[10px] text-red-400">{error}</div>}
    </div>
  );
}

function FloatingSelect({ label, name, value, onChange, options, required = true, error }) {
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="glass-input appearance-none cursor-pointer peer pt-6"
        style={{ background: 'rgba(15, 23, 42, 0.6)' }}
      >
        <option value="" className="bg-navy-800"> </option>
        {options.map((o) => (
          <option key={o} value={o} className="bg-navy-800">{o}</option>
        ))}
      </select>
      <label className="absolute left-4 top-3 text-[10px] text-accent font-semibold uppercase tracking-wider pointer-events-none">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
      {error && <div className="mt-1 text-[10px] text-red-400">{error}</div>}
    </div>
  );
}

function CountryInput({ label, name, value, onChange, options, required = true, listId, error }) {
  return (
    <div className="relative">
      <input
        type="text"
        list={listId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder=" "
        required={required}
        className="glass-input peer pt-6"
        style={{ background: 'rgba(15, 23, 42, 0.6)' }}
      />
      <datalist id={listId}>
        {options.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
      <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none transition-all duration-300 peer-focus:top-3 peer-focus:text-[10px] peer-focus:text-accent peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wider peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-accent peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-wider">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {error && <div className="mt-1 text-[10px] text-red-400">{error}</div>}
    </div>
  );
}

function ToggleGroup({ label, name, value, onChange, error }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-gray-300">{label}<span className="text-red-400 ml-1">*</span></span>
        <div className="flex items-center gap-2">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => onChange({ target: { name, value: String(v) } })}
              className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-[2px] font-semibold transition-colors ${
                String(value) === String(v) ? 'text-white' : 'text-white/35'
              }`}
              style={{
                background: String(value) === String(v) ? 'rgba(232,93,26,0.22)' : 'rgba(255,255,255,0.03)',
                border: String(value) === String(v) ? '1px solid rgba(232,93,26,0.45)' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {v ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="mt-1 text-[10px] text-red-400">{error}</div>}
    </div>
  );
}

function CountryCheckboxSelect({ label, name, value, onChange, options, searchValue, onSearch }) {
  return (
    <div className="relative">
      <label className="block text-[10px] font-semibold uppercase tracking-[2px] mb-2" style={{ color: 'rgba(255,255,255,0.32)' }}>
        {label}<span className="text-red-400 ml-1">*</span>
      </label>
      <input
        type="text"
        placeholder="Search country..."
        value={searchValue}
        onChange={(e) => onSearch(e.target.value)}
        className="glass-input mb-3"
        style={{ background: 'rgba(15, 23, 42, 0.6)' }}
      />
      <div className="glass-input min-h-[180px] max-h-[220px] overflow-y-auto p-3" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
        {options.map((o) => (
          <label key={o} className="flex items-center gap-2 text-xs text-gray-300 mb-2">
            <input
              type="checkbox"
              name={name}
              value={o}
              checked={value.includes(o)}
              onChange={onChange}
            />
            <span>{o}</span>
          </label>
        ))}
        {options.length === 0 && (
          <div className="text-xs text-gray-500">No matches</div>
        )}
      </div>
    </div>
  );
}

export default function NewEntryPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [meta, setMeta] = useState(emptyMeta);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitOk, setSubmitOk] = useState('');
  const [errors, setErrors] = useState({});
  const [countrySearch, setCountrySearch] = useState('');
  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setSubmitError('Not authenticated.');
      setLoadingMeta(false);
      return;
    }
    let active = true;
    api.getMeta()
      .then((data) => {
        if (!active) return;
        setMeta({
          nationalities: data.nationalities || [],
          visaTypes: data.visaTypes || [],
          checkpoints: data.checkpoints || [],
          genders: data.genders || ['Male', 'Female', 'Other'],
          portOfEntryTypes: data.portOfEntryTypes || ['Airport', 'Land Border', 'Seaport'],
          accommodationTypes: data.accommodationTypes || ['Hotel', 'Host', 'Rental', 'Other'],
          purposeOfVisitOptions: data.purposeOfVisitOptions || ['Tourism', 'Work', 'Study', 'Business', 'Family Visit', 'Transit'],
          entryCounts: data.entryCounts || ['Single Entry', 'Multiple Entry'],
        });
        setLoadingMeta(false);
      })
      .catch((err) => {
        if (!active) return;
        setSubmitError(err.message || 'Failed to load form data.');
        setLoadingMeta(false);
      });
    return () => { active = false; };
  }, [user, authLoading]);

  const countries = useMemo(() => meta.nationalities, [meta.nationalities]);
  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => c.toLowerCase().includes(q));
  }, [countries, countrySearch]);

  const isKnownCountry = (value) => countries.includes(value);
  const parseDate = (value) => (value ? new Date(`${value}T00:00:00`) : null);
  const trimValue = (value) => (typeof value === 'string' ? value.trim() : value);
  const isPositiveInteger = (value) => /^[1-9]\d*$/.test(String(value));

  const getErrorsForStep = (s, data) => {
    const next = {};
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (s === 0) {
      if (!fullName) next.fullName = 'Required field';
      if (!data.gender) next.gender = 'Required field';
      if (!data.dob) {
        next.dob = 'Required field';
      } else {
        const dob = parseDate(data.dob);
        if (!dob || Number.isNaN(dob.getTime())) next.dob = 'Invalid date';
        else if (dob > today) next.dob = 'Date of birth cannot be in the future';
      }
      if (!nationality) next.nationality = 'Required field';
      else if (!isKnownCountry(nationality)) next.nationality = 'Select a listed country';
      if (!residenceCountry) next.residenceCountry = 'Required field';
      else if (!isKnownCountry(residenceCountry)) next.residenceCountry = 'Select a listed country';
      if (!phone) next.phone = 'Required field';
      else if (!/^[+\d][\d\s()-]{6,19}$/.test(phone)) next.phone = 'Enter a valid phone number';
      if (!email) next.email = 'Required field';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address';
    }

    if (s === 1) {
      if (!passportNumber) next.passportNumber = 'Required field';
      if (!passportIssuingCountry) next.passportIssuingCountry = 'Required field';
      else if (!isKnownCountry(passportIssuingCountry)) next.passportIssuingCountry = 'Select a listed country';
      if (!data.passportIssueDate) next.passportIssueDate = 'Required field';
      if (!data.passportExpiryDate) next.passportExpiryDate = 'Required field';

      const issueDate = parseDate(data.passportIssueDate);
      const expiryDate = parseDate(data.passportExpiryDate);
      if (data.passportIssueDate && (!issueDate || Number.isNaN(issueDate.getTime()))) next.passportIssueDate = 'Invalid date';
      if (data.passportExpiryDate && (!expiryDate || Number.isNaN(expiryDate.getTime()))) next.passportExpiryDate = 'Invalid date';
      if (issueDate && expiryDate && issueDate >= expiryDate) next.passportExpiryDate = 'Expiry must be after issue date';
      if (expiryDate && expiryDate <= today) next.passportExpiryDate = 'Passport must still be valid';

      const arrival = parseDate(data.arrivalDate);
      if (expiryDate && arrival) {
        const sixMonthsLater = new Date(arrival);
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
        if (expiryDate < sixMonthsLater) next.passportExpiryDate = 'Must be valid 6 months beyond arrival';
      }
    }

    if (s === 2) {
      if (!data.visaType) next.visaType = 'Required field';
      if (!visaNumber) next.visaNumber = 'Required field';
      if (!visaIssuingCountry) next.visaIssuingCountry = 'Required field';
      else if (!isKnownCountry(visaIssuingCountry)) next.visaIssuingCountry = 'Select a listed country';
      if (!data.visaIssueDate) next.visaIssueDate = 'Required field';
      if (!data.visaExpiryDate) next.visaExpiryDate = 'Required field';
      if (!data.entryCount) next.entryCount = 'Required field';

      const issueDate = parseDate(data.visaIssueDate);
      const expiryDate = parseDate(data.visaExpiryDate);
      if (data.visaIssueDate && (!issueDate || Number.isNaN(issueDate.getTime()))) next.visaIssueDate = 'Invalid date';
      if (data.visaExpiryDate && (!expiryDate || Number.isNaN(expiryDate.getTime()))) next.visaExpiryDate = 'Invalid date';
      if (issueDate && expiryDate && issueDate >= expiryDate) next.visaExpiryDate = 'Expiry must be after issue date';

      const arrival = parseDate(data.arrivalDate);
      const departure = parseDate(data.departureDate);
      if (expiryDate && arrival && expiryDate < arrival) next.visaExpiryDate = 'Visa must be valid on arrival';
      if (expiryDate && departure && expiryDate < departure) next.visaExpiryDate = 'Visa must be valid through departure';
    }

    if (s === 3) {
      if (!destinationCountry) next.destinationCountry = 'Required field';
      else if (!isKnownCountry(destinationCountry)) next.destinationCountry = 'Select a listed country';
      if (!data.portOfEntry) next.portOfEntry = 'Required field';
      if (!data.arrivalDate) next.arrivalDate = 'Required field';
      if (!data.departureDate) next.departureDate = 'Required field';

      const arrival = parseDate(data.arrivalDate);
      const departure = parseDate(data.departureDate);
      if (data.arrivalDate && (!arrival || Number.isNaN(arrival.getTime()))) next.arrivalDate = 'Invalid date';
      if (data.departureDate && (!departure || Number.isNaN(departure.getTime()))) next.departureDate = 'Invalid date';
      if (arrival && departure && arrival > departure) next.departureDate = 'Departure must be after arrival';
    }

    if (s === 4) {
      if (!data.stayDurationDays) next.stayDurationDays = 'Required field';
      else if (!isPositiveInteger(data.stayDurationDays)) next.stayDurationDays = 'Enter a whole number greater than 0';
      if (!data.accommodationType) next.accommodationType = 'Required field';
      if (!accommodationAddress) next.accommodationAddress = 'Required field';
    }

    if (s === 5) {
      if (!data.purposeOfVisit) next.purposeOfVisit = 'Required field';
    }

    if (s === 6) {
      if (!['true', 'false'].includes(data.visaDenied)) next.visaDenied = 'Select Yes or No';
      if (!['true', 'false'].includes(data.deported)) next.deported = 'Select Yes or No';
      if (!['true', 'false'].includes(data.overstayed)) next.overstayed = 'Select Yes or No';
      if (!['true', 'false'].includes(data.criminalRecord)) next.criminalRecord = 'Select Yes or No';
      if (!Array.isArray(data.countriesVisited) || data.countriesVisited.length === 0) {
        next.countriesVisited = 'Select at least one country';
      }
    }

    return next;
  };

  const getAllErrors = (data) => (
    Object.assign(
      {},
      getErrorsForStep(0, data),
      getErrorsForStep(1, data),
      getErrorsForStep(2, data),
      getErrorsForStep(3, data),
      getErrorsForStep(4, data),
      getErrorsForStep(5, data),
      getErrorsForStep(6, data),
    )
  );

  const getFirstErrorStep = (fieldErrors) => {
    const steps = Object.keys(fieldErrors)
      .map((field) => fieldStepMap[field])
      .filter((value) => typeof value === 'number');
    return steps.length ? Math.min(...steps) : 0;
  };

  const reviewErrors = useMemo(() => {
    const grouped = new Map();
    Object.entries(errors).forEach(([field, message]) => {
      const errorStep = fieldStepMap[field];
      if (typeof errorStep !== 'number') return;
      const label = stepLabels[errorStep];
      const current = grouped.get(label) || [];
      current.push({ field, message, step: errorStep });
      grouped.set(label, current);
    });
    return Array.from(grouped.entries());
  }, [errors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'countriesVisited') {
      const checked = e.target.checked;
      setForm((prev) => {
        const next = new Set(prev.countriesVisited);
        if (checked) next.add(value);
        else next.delete(value);
        const nextForm = { ...prev, countriesVisited: Array.from(next) };
        if (Object.keys(errors).length > 0) {
          setErrors(getAllErrors(nextForm));
        }
        return nextForm;
      });
      return;
    }
    setForm((prev) => {
      const nextForm = { ...prev, [name]: value };
      if (Object.keys(errors).length > 0) {
        setErrors(getAllErrors(nextForm));
      }
      return nextForm;
    });
  };

  const stepError = (message) => {
    setSubmitError(message);
  };

  const validateStep = (s) => {
    setSubmitError('');
    const newErrors = getErrorsForStep(s, form);
    if (Object.keys(newErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return stepError('Please correct the highlighted fields.');
    }
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(fieldStepMap)
        .filter((field) => fieldStepMap[field] === s)
        .forEach((field) => { delete next[field]; });
      return next;
    });
    return true;
  };

  const validateAll = () => {
    setSubmitError('');
    const allErrors = getAllErrors(form);
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      const firstStep = getFirstErrorStep(allErrors);
      setStep(firstStep);
      return stepError('Please correct the highlighted fields before submitting.');
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 7));
    }
  };

  const jumpToStep = (targetStep) => {
    if (targetStep === step) return;
    if (targetStep < step) {
      setSubmitError('');
      setStep(targetStep);
      return;
    }
    if (validateStep(step)) {
      setStep(targetStep);
    }
  };

  const prevStep = () => {
    setSubmitError('');
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const resetForm = () => {
    setStep(0);
    setErrors({});
    setForm(initialFormState);
    setCountrySearch('');
    setSubmitError('');
  };

  const submitEntry = async () => {
    if (!validateAll()) return;
    setSubmitting(true);
    setSubmitError('');
    setSubmitOk('');
    try {
      await api.createEntry({
        ...form,
        fullName: trimValue(form.fullName),
        nationality: trimValue(form.nationality),
        residenceCountry: trimValue(form.residenceCountry),
        phone: trimValue(form.phone),
        email: trimValue(form.email),
        passportNumber: trimValue(form.passportNumber),
        passportIssuingCountry: trimValue(form.passportIssuingCountry),
        visaNumber: trimValue(form.visaNumber),
        visaIssuingCountry: trimValue(form.visaIssuingCountry),
        destinationCountry: trimValue(form.destinationCountry),
        accommodationAddress: trimValue(form.accommodationAddress),
        stayDurationDays: Number(form.stayDurationDays),
        visaDenied: form.visaDenied === 'true',
        deported: form.deported === 'true',
        overstayed: form.overstayed === 'true',
        criminalRecord: form.criminalRecord === 'true',
      });
      resetForm();
      navigate('/dashboard');
    } catch (err) {
      if (err.fields) {
        setErrors(err.fields);
        setStep(getFirstErrorStep(err.fields));
      }
      setSubmitError(err.message || 'Failed to save entry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 bg-grid">
      {loadingMeta && (
        <div className="glass-card p-4 text-sm text-gray-400 mb-6">Loading form data...</div>
      )}
      {submitError && (
        <div className="glass-card p-4 text-sm text-red-400 mb-6">{submitError}</div>
      )}
      {submitOk && (
        <div className="glass-card p-4 text-sm text-green-400 mb-6">{submitOk}</div>
      )}

      <header className="mb-8 opacity-0 animate-fade-up">
        <h1 className="text-2xl font-bold text-white tracking-tight">New Traveler Entry</h1>
        <p className="text-sm text-gray-500 mt-0.5">Register a new border crossing entry</p>
      </header>

      <div className="max-w-4xl">
        <ProgressBar step={step} onStepSelect={jumpToStep} />

        <div
          className="rounded-2xl p-8 opacity-0 animate-fade-up stagger-1"
          style={{
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          {step === 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-6">Personal Identity Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <FloatingInput label="Full Legal Name" name="fullName" value={form.fullName} onChange={handleChange} error={errors.fullName} />
                </div>
                <FloatingSelect label="Gender" name="gender" value={form.gender} onChange={handleChange} options={meta.genders} error={errors.gender} />
                <FloatingInput label="Date of Birth" name="dob" value={form.dob} onChange={handleChange} type="date" error={errors.dob} />
                <CountryInput label="Nationality" name="nationality" value={form.nationality} onChange={handleChange} options={countries} listId="nat-list" error={errors.nationality} />
                <CountryInput label="Country of Residence" name="residenceCountry" value={form.residenceCountry} onChange={handleChange} options={countries} listId="res-list" error={errors.residenceCountry} />
                <FloatingInput label="Phone Number" name="phone" value={form.phone} onChange={handleChange} type="tel" error={errors.phone} />
                <FloatingInput label="Email Address" name="email" value={form.email} onChange={handleChange} type="email" error={errors.email} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-6">Passport Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FloatingInput label="Passport Number" name="passportNumber" value={form.passportNumber} onChange={handleChange} error={errors.passportNumber} />
                <CountryInput label="Passport Issuing Country" name="passportIssuingCountry" value={form.passportIssuingCountry} onChange={handleChange} options={countries} listId="pass-issue" error={errors.passportIssuingCountry} />
                <FloatingInput label="Passport Issue Date" name="passportIssueDate" value={form.passportIssueDate} onChange={handleChange} type="date" error={errors.passportIssueDate} />
                <FloatingInput label="Passport Expiry Date" name="passportExpiryDate" value={form.passportExpiryDate} onChange={handleChange} type="date" error={errors.passportExpiryDate} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-6">Visa Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FloatingSelect label="Visa Type" name="visaType" value={form.visaType} onChange={handleChange} options={meta.visaTypes} error={errors.visaType} />
                <FloatingInput label="Visa Number" name="visaNumber" value={form.visaNumber} onChange={handleChange} error={errors.visaNumber} />
                <CountryInput label="Visa Issuing Country" name="visaIssuingCountry" value={form.visaIssuingCountry} onChange={handleChange} options={countries} listId="visa-issue" error={errors.visaIssuingCountry} />
                <FloatingInput label="Visa Issue Date" name="visaIssueDate" value={form.visaIssueDate} onChange={handleChange} type="date" error={errors.visaIssueDate} />
                <FloatingInput label="Visa Expiry Date" name="visaExpiryDate" value={form.visaExpiryDate} onChange={handleChange} type="date" error={errors.visaExpiryDate} />
                <FloatingSelect label="Number of Entries" name="entryCount" value={form.entryCount} onChange={handleChange} options={meta.entryCounts} error={errors.entryCount} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-6">Travel Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <CountryInput label="Destination Country" name="destinationCountry" value={form.destinationCountry} onChange={handleChange} options={countries} listId="dest-country" error={errors.destinationCountry} />
                <FloatingSelect label="Port of Entry" name="portOfEntry" value={form.portOfEntry} onChange={handleChange} options={meta.portOfEntryTypes} error={errors.portOfEntry} />
                <FloatingInput label="Arrival Date" name="arrivalDate" value={form.arrivalDate} onChange={handleChange} type="date" error={errors.arrivalDate} />
                <FloatingInput label="Departure Date" name="departureDate" value={form.departureDate} onChange={handleChange} type="date" error={errors.departureDate} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-6">Stay Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FloatingInput label="Intended Stay Duration (days)" name="stayDurationDays" value={form.stayDurationDays} onChange={handleChange} type="number" error={errors.stayDurationDays} />
                <FloatingSelect label="Accommodation Type" name="accommodationType" value={form.accommodationType} onChange={handleChange} options={meta.accommodationTypes} error={errors.accommodationType} />
                <div className="md:col-span-2">
                  <FloatingInput label="Accommodation Address" name="accommodationAddress" value={form.accommodationAddress} onChange={handleChange} error={errors.accommodationAddress} />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-6">Purpose of Visit</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FloatingSelect label="Purpose of Visit" name="purposeOfVisit" value={form.purposeOfVisit} onChange={handleChange} options={meta.purposeOfVisitOptions} error={errors.purposeOfVisit} />
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-6">Immigration History and Risk Factors</h2>
              <div className="grid grid-cols-1 gap-5">
                <ToggleGroup label="Previously denied a visa?" name="visaDenied" value={form.visaDenied} onChange={handleChange} error={errors.visaDenied} />
                <ToggleGroup label="Ever deported from another country?" name="deported" value={form.deported} onChange={handleChange} error={errors.deported} />
                <ToggleGroup label="Ever overstayed a visa?" name="overstayed" value={form.overstayed} onChange={handleChange} error={errors.overstayed} />
                <ToggleGroup label="Criminal record?" name="criminalRecord" value={form.criminalRecord} onChange={handleChange} error={errors.criminalRecord} />
                <CountryCheckboxSelect
                  label="Countries visited in the last 5 years"
                  name="countriesVisited"
                  value={form.countriesVisited}
                  onChange={handleChange}
                  options={filteredCountries}
                  searchValue={countrySearch}
                  onSearch={setCountrySearch}
                />
                {errors.countriesVisited && <div className="text-[10px] text-red-400">{errors.countriesVisited}</div>}
              </div>
            </div>
          )}

          {step === 7 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-6">Review and Submission</h2>
              {reviewErrors.length > 0 && (
                <div className="glass-card px-4 py-4 mb-6">
                  <div className="text-sm text-red-300 mb-3">Resolve these issues before submitting:</div>
                  <div className="space-y-3">
                    {reviewErrors.map(([label, items]) => (
                      <div key={label}>
                        <button
                          type="button"
                          className="text-xs uppercase tracking-[2px] text-accent"
                          onClick={() => setStep(items[0].step)}
                        >
                          {label}
                        </button>
                        <div className="mt-1 text-xs text-red-300">
                          {items.map((item) => item.message).join(' | ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                {Object.entries(form).map(([key, value]) => (
                  <div key={key} className="glass-card px-4 py-3">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{key}</div>
                    <div>{Array.isArray(value) ? value.join(', ') : String(value || '-')}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <button className="btn-accent text-sm py-2" onClick={submitEntry} disabled={submitting}>
                  Submit Entry
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center gap-4">
            {step > 0 && (
              <button
                onClick={prevStep}
                className="px-6 py-3 rounded-xl text-sm font-medium text-gray-400 border border-glass-border hover:text-white hover:border-gray-500 transition-all duration-300 flex items-center gap-2"
              >
                Back
              </button>
            )}
            {step < 7 && (
              <button onClick={nextStep} className="btn-accent flex items-center gap-2">
                Next Step
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
