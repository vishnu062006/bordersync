import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchableSelect from '../components/SearchableSelect';
import { useTravelerFlow } from '../context/TravelerFlowContext';
import { api } from '../lib/api';
import { evaluateTravelerRisk } from '../lib/riskEngine';
import {
  emptyMeta,
  fieldLabels,
  fieldStepMap,
  formatFieldValue,
  initialFormState,
  normalizeMeta,
  stepLabels,
  toSubmissionPayload,
} from '../lib/travelerForm';
import { getAllErrors, getErrorsForStep, getFirstErrorStep } from '../lib/travelerValidation';
import { useAuth } from '../context/AuthContext';
import { diffDaysInclusive, parseDate } from '../lib/dateUtils';

function ProgressBar({ step, onStepSelect }) {
  return (
    <div className="mb-10">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        {stepLabels.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => onStepSelect(index)}
            className="flex items-center gap-2 rounded-xl transition-all duration-300"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500"
              style={{
                background:
                  index < step
                    ? 'linear-gradient(135deg, #E85D1A, #FF7A3D)'
                    : index === step
                    ? 'rgba(232, 93, 26, 0.15)'
                    : 'rgba(255,255,255,0.05)',
                color: index <= step ? '#fff' : '#6B7280',
                border: index === step ? '2px solid #E85D1A' : '2px solid transparent',
              }}
            >
              {index < step ? 'OK' : index + 1}
            </div>
            <span className={`text-xs font-medium hidden md:inline ${index <= step ? 'text-white' : 'text-gray-600'}`}>
              {label}
            </span>
          </button>
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

function FloatingInput({ label, name, value, onChange, type = 'text', required = true, error, placeholder, readOnly = false }) {
  return (
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder=" "
        required={required}
        readOnly={readOnly}
        className="glass-input peer pt-6"
        style={{ background: readOnly ? 'rgba(255,255,255,0.03)' : 'rgba(15, 23, 42, 0.6)' }}
      />
      <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none transition-all duration-300 peer-focus:top-3 peer-focus:text-[10px] peer-focus:text-accent peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wider peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-accent peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-wider">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {placeholder && !value && <div className="absolute left-4 bottom-3 text-xs text-gray-600 pointer-events-none">{placeholder}</div>}
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
        {options.map((option) => (
          <option key={option} value={option} className="bg-navy-800">{option}</option>
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

function ToggleGroup({ label, name, value, onChange, error }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-gray-300">{label}<span className="text-red-400 ml-1">*</span></span>
        <div className="flex items-center gap-2">
          {[true, false].map((option) => (
            <button
              key={String(option)}
              type="button"
              onClick={() => onChange({ target: { name, value: String(option) } })}
              className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-[2px] font-semibold transition-colors ${
                String(value) === String(option) ? 'text-white' : 'text-white/35'
              }`}
              style={{
                background: String(value) === String(option) ? 'rgba(232,93,26,0.22)' : 'rgba(255,255,255,0.03)',
                border: String(value) === String(option) ? '1px solid rgba(232,93,26,0.45)' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {option ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="mt-1 text-[10px] text-red-400">{error}</div>}
    </div>
  );
}

function ReviewCard({ label, value }) {
  return (
    <div className="glass-card px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{label}</div>
      <div className="text-sm text-gray-200">{value}</div>
    </div>
  );
}

export default function NewEntryPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { draft, setDraft, clearDraft, setAnalysis } = useTravelerFlow();
  const [step, setStep] = useState(0);
  const [meta, setMeta] = useState(emptyMeta);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(draft || initialFormState);

  useEffect(() => {
    setDraft(form);
  }, [form, setDraft]);

  useEffect(() => {
    const arrivalDate = parseDate(form.arrivalDate);
    const departureDate = parseDate(form.departureDate);
    if (!arrivalDate || !departureDate || departureDate < arrivalDate) {
      if (form.stayDurationDays !== '') {
        setForm((prev) => ({ ...prev, stayDurationDays: '' }));
      }
      return;
    }

    const calculatedDays = diffDaysInclusive(arrivalDate, departureDate);
    const nextValue = calculatedDays ? String(calculatedDays) : '';
    if (nextValue !== String(form.stayDurationDays || '')) {
      setForm((prev) => ({ ...prev, stayDurationDays: nextValue }));
    }
  }, [form.arrivalDate, form.departureDate, form.stayDurationDays]);

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
        setMeta(normalizeMeta(data));
        setLoadingMeta(false);
      })
      .catch((error) => {
        if (!active) return;
        setSubmitError(error.message || 'Failed to load form data.');
        setLoadingMeta(false);
      });
    return () => {
      active = false;
    };
  }, [authLoading, user]);

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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => {
      const nextForm = { ...prev, [name]: value };
      if (Object.keys(errors).length > 0) {
        setErrors(getAllErrors(nextForm, meta));
      }
      return nextForm;
    });
  };

  const validateStep = (currentStep) => {
    setSubmitError('');
    const newErrors = getErrorsForStep(currentStep, form, meta);
    if (Object.keys(newErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      setSubmitError('Please correct the highlighted fields.');
      return false;
    }
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(fieldStepMap)
        .filter((field) => fieldStepMap[field] === currentStep)
        .forEach((field) => {
          delete next[field];
        });
      return next;
    });
    return true;
  };

  const validateAll = () => {
    setSubmitError('');
    const allErrors = getAllErrors(form, meta);
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      setStep(getFirstErrorStep(allErrors));
      setSubmitError('Please correct the highlighted fields before submitting.');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const prevStep = () => {
    setSubmitError('');
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const jumpToStep = (targetStep) => {
    if (targetStep === step) return;
    if (targetStep < step) {
      setStep(targetStep);
      return;
    }
    if (validateStep(step)) {
      setStep(targetStep);
    }
  };

  const submitEntry = async () => {
    if (!validateAll()) return;
    setSubmitting(true);
    setSubmitError('');
    const payload = toSubmissionPayload(form);
    const result = evaluateTravelerRisk(payload, meta);

    try {
      const response = await api.createEntry(payload);
      clearDraft();
      setAnalysis({
        traveler: payload,
        entry: response.entry,
        result,
        narrative: null,
      });
      setForm(initialFormState);
      setErrors({});
      setStep(0);
      navigate('/risk-analysis');
    } catch (error) {
      if (error.fields) {
        setErrors(error.fields);
        setStep(getFirstErrorStep(error.fields));
      }
      setSubmitError(error.message || 'Failed to save entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const reviewItems = Object.entries(form).map(([key, value]) => ({
    label: fieldLabels[key] || key,
    value: formatFieldValue(key, value),
  }));

  return (
    <div className="min-h-screen bg-navy-900 bg-grid">
      {loadingMeta && (
        <div className="glass-card p-4 text-sm text-gray-400 mb-6">Loading form data...</div>
      )}
      {submitError && (
        <div className="glass-card p-4 text-sm text-red-400 mb-6">{submitError}</div>
      )}

      <header className="mb-8 opacity-0 animate-fade-up">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Traveler Intake Flow</h1>
            <p className="text-sm text-gray-500 mt-0.5">Structured intake, validation, review, and final AI-assisted risk analysis</p>
          </div>
          <div className="glass-card px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 mb-1">Current Stage</p>
            <p className="text-sm font-semibold text-white">{stepLabels[step]}</p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl">
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
              <h2 className="text-lg font-semibold text-white mb-6">Page 1 - Personal Identity Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <FloatingInput label="Full Legal Name" name="fullName" value={form.fullName} onChange={handleChange} error={errors.fullName} />
                </div>
                <FloatingSelect label="Gender" name="gender" value={form.gender} onChange={handleChange} options={meta.genders} error={errors.gender} />
                <FloatingInput label="Date of Birth" name="dob" value={form.dob} onChange={handleChange} type="date" error={errors.dob} />
                <SearchableSelect label="Nationality" name="nationality" value={form.nationality} onChange={handleChange} options={meta.nationalities} error={errors.nationality} placeholder="Search country" />
                <SearchableSelect label="Country of Residence" name="residenceCountry" value={form.residenceCountry} onChange={handleChange} options={meta.nationalities} error={errors.residenceCountry} placeholder="Search country" />
                <FloatingInput label="Phone Number" name="phone" value={form.phone} onChange={handleChange} type="tel" error={errors.phone} placeholder="+1 202 555 0199" />
                <FloatingInput label="Email Address" name="email" value={form.email} onChange={handleChange} type="email" error={errors.email} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-6">Page 2 - Passport Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FloatingInput label="Passport Number" name="passportNumber" value={form.passportNumber} onChange={handleChange} error={errors.passportNumber} />
                <SearchableSelect label="Passport Issuing Country" name="passportIssuingCountry" value={form.passportIssuingCountry} onChange={handleChange} options={meta.nationalities} error={errors.passportIssuingCountry} placeholder="Search country" />
                <FloatingInput label="Passport Issue Date" name="passportIssueDate" value={form.passportIssueDate} onChange={handleChange} type="date" error={errors.passportIssueDate} />
                <FloatingInput label="Passport Expiry Date" name="passportExpiryDate" value={form.passportExpiryDate} onChange={handleChange} type="date" error={errors.passportExpiryDate} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-6">Page 3 - Visa Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FloatingSelect label="Visa Type" name="visaType" value={form.visaType} onChange={handleChange} options={meta.visaTypes} error={errors.visaType} />
                <FloatingInput label="Visa Number" name="visaNumber" value={form.visaNumber} onChange={handleChange} error={errors.visaNumber} />
                <SearchableSelect label="Visa Issuing Country" name="visaIssuingCountry" value={form.visaIssuingCountry} onChange={handleChange} options={meta.nationalities} error={errors.visaIssuingCountry} placeholder="Search country" />
                <FloatingInput label="Visa Issue Date" name="visaIssueDate" value={form.visaIssueDate} onChange={handleChange} type="date" error={errors.visaIssueDate} />
                <FloatingInput label="Visa Expiry Date" name="visaExpiryDate" value={form.visaExpiryDate} onChange={handleChange} type="date" error={errors.visaExpiryDate} />
                <FloatingSelect label="Number of Entries" name="entryCount" value={form.entryCount} onChange={handleChange} options={meta.entryCounts} error={errors.entryCount} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-6">Page 4 - Travel Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SearchableSelect label="Destination Country" name="destinationCountry" value={form.destinationCountry} onChange={handleChange} options={meta.nationalities} error={errors.destinationCountry} placeholder="Search country" />
                <FloatingSelect label="Port of Entry" name="portOfEntry" value={form.portOfEntry} onChange={handleChange} options={meta.portOfEntryTypes} error={errors.portOfEntry} />
                <FloatingInput label="Arrival Date" name="arrivalDate" value={form.arrivalDate} onChange={handleChange} type="date" error={errors.arrivalDate} />
                <FloatingInput label="Departure Date" name="departureDate" value={form.departureDate} onChange={handleChange} type="date" error={errors.departureDate} />
                <FloatingInput
                  label="Intended Stay Duration (days)"
                  name="stayDurationDays"
                  value={form.stayDurationDays}
                  onChange={handleChange}
                  type="number"
                  error={errors.stayDurationDays}
                  readOnly
                />
                <FloatingSelect label="Accommodation Type" name="accommodationType" value={form.accommodationType} onChange={handleChange} options={meta.accommodationTypes} error={errors.accommodationType} />
                <div className="md:col-span-2">
                  <FloatingInput label="Accommodation Address" name="accommodationAddress" value={form.accommodationAddress} onChange={handleChange} error={errors.accommodationAddress} />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-6">Page 5 - Purpose of Visit</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FloatingSelect label="Purpose of Visit" name="purposeOfVisit" value={form.purposeOfVisit} onChange={handleChange} options={meta.purposeOfVisitOptions} error={errors.purposeOfVisit} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-6">Page 6 - Immigration History and Risk Factors</h2>
              <div className="grid grid-cols-1 gap-5">
                <ToggleGroup label="Have you previously been denied a visa?" name="visaDenied" value={form.visaDenied} onChange={handleChange} error={errors.visaDenied} />
                <ToggleGroup label="Have you ever been deported from another country?" name="deported" value={form.deported} onChange={handleChange} error={errors.deported} />
                <ToggleGroup label="Have you ever overstayed a visa?" name="overstayed" value={form.overstayed} onChange={handleChange} error={errors.overstayed} />
                <ToggleGroup label="Do you have a criminal record?" name="criminalRecord" value={form.criminalRecord} onChange={handleChange} error={errors.criminalRecord} />
                <SearchableSelect
                  label="Countries Visited in the Last 5 Years"
                  name="countriesVisited"
                  value={form.countriesVisited}
                  onChange={handleChange}
                  options={meta.nationalities}
                  error={errors.countriesVisited}
                  placeholder="Search and select countries"
                  required={false}
                  multiple
                />
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-6">Final Page - Review and Submission</h2>
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
                          {items.map((item) => `${fieldLabels[item.field] || item.field}: ${item.message}`).join(' | ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviewItems.map((item) => (
                  <ReviewCard key={item.label} label={item.label} value={item.value} />
                ))}
              </div>

              <div className="mt-6 glass-card p-5">
                <p className="text-sm text-gray-300 leading-7">
                  Submission will save the traveler intake record, run the rule-based risk engine, and open the final AI Risk Analysis dashboard with Gemini narrative support when configured.
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {step > 0 && (
              <button
                onClick={prevStep}
                className="px-6 py-3 rounded-xl text-sm font-medium text-gray-400 border border-glass-border hover:text-white hover:border-gray-500 transition-all duration-300"
              >
                Back
              </button>
            )}
            {step < 6 ? (
              <button onClick={nextStep} className="btn-accent flex items-center gap-2">
                Next Step
              </button>
            ) : (
              <button onClick={submitEntry} className="btn-accent" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit and Analyze'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
