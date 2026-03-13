import { useState, useEffect } from 'react';
import { visaTypes, nationalities } from '../data/mockData';

const checkpoints = [
    'Terminal A - Gate 1', 'Terminal A - Gate 2', 'Terminal A - Gate 3',
    'Terminal A - Gate 4', 'Terminal A - Gate 5', 'Terminal B - Gate 1',
    'Terminal B - Gate 3', 'Terminal C - Gate 1', 'Terminal C - Gate 2',
    'Terminal D - VIP',
];

const riskResults = [
    { level: 'LOW', score: 18, color: '#22C55E', reason: 'All travel documents verified. No prior violations or watchlist matches. Standard tourist profile with valid return ticket.' },
    { level: 'MEDIUM', score: 52, color: '#F59E0B', reason: 'Previous visa overstay detected in 2024. Secondary document verification recommended. Enhanced monitoring advised.' },
    { level: 'HIGH', score: 87, color: '#EF4444', reason: 'Partial name match on INTERPOL watchlist. Biometric anomalies detected. Immediate secondary screening and supervisor review required.' },
];

function ProgressBar({ step }) {
    const steps = ['Personal Info', 'Travel Info', 'AI Analysis'];
    return (
        <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
                {steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500"
                            style={{
                                background: i < step ? 'linear-gradient(135deg, #E85D1A, #FF7A3D)' : i === step ? 'rgba(232, 93, 26, 0.15)' : 'rgba(255,255,255,0.05)',
                                color: i <= step ? '#fff' : '#6B7280',
                                border: i === step ? '2px solid #E85D1A' : '2px solid transparent',
                                boxShadow: i < step ? '0 0 15px rgba(232, 93, 26, 0.3)' : 'none',
                            }}
                        >
                            {i < step ? '✓' : i + 1}
                        </div>
                        <span className={`text-xs font-medium hidden sm:inline ${i <= step ? 'text-white' : 'text-gray-600'}`}>{s}</span>
                    </div>
                ))}
            </div>
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                        width: `${((step) / 2) * 100}%`,
                        background: 'linear-gradient(90deg, #E85D1A, #FF7A3D)',
                        boxShadow: '0 0 10px rgba(232, 93, 26, 0.4)',
                    }}
                />
            </div>
        </div>
    );
}

function FloatingInput({ label, name, value, onChange, type = 'text', required = true, mono = false }) {
    return (
        <div className="relative">
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder=" "
                required={required}
                className={`glass-input peer pt-6 ${mono ? 'font-mono' : ''}`}
                style={{ background: 'rgba(15, 23, 42, 0.6)' }}
            />
            <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none transition-all duration-300 peer-focus:top-3 peer-focus:text-[10px] peer-focus:text-accent peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wider peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-accent peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-wider">
                {label}
            </label>
        </div>
    );
}

function FloatingSelect({ label, name, value, onChange, options, required = true }) {
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
                {label}
            </label>
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
        </div>
    );
}

function RiskScoreRing({ score, color }) {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const [offset, setOffset] = useState(circumference);

    useEffect(() => {
        const t = setTimeout(() => {
            setOffset(circumference - (score / 100) * circumference);
        }, 300);
        return () => clearTimeout(t);
    }, [score, circumference]);

    return (
        <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle
                cx="70" cy="70" r={radius} fill="none"
                stroke={color} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="progress-ring-circle"
                style={{ filter: `drop-shadow(0 0 6px ${color})` }}
            />
            <text x="70" y="65" textAnchor="middle" fill={color} fontSize="28" fontWeight="800" fontFamily="Inter">
                {score}
            </text>
            <text x="70" y="85" textAnchor="middle" fill="#6B7280" fontSize="10" fontWeight="500" fontFamily="Inter">
                RISK SCORE
            </text>
        </svg>
    );
}

export default function NewEntryPage() {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState({
        name: '', nationality: '', passport: '', dob: '',
        visaType: '', visaExpiry: '', purpose: '', checkpoint: '',
    });
    const [scanning, setScanning] = useState(false);
    const [riskResult, setRiskResult] = useState(null);
    const [slideDir, setSlideDir] = useState('right');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const nextStep = () => {
        if (step < 2) {
            setSlideDir('right');
            setStep(step + 1);
            if (step === 1) {
                setScanning(true);
                setTimeout(() => {
                    setScanning(false);
                    setRiskResult(riskResults[Math.floor(Math.random() * riskResults.length)]);
                }, 3000);
            }
        }
    };

    const prevStep = () => {
        if (step > 0) {
            setSlideDir('left');
            setRiskResult(null);
            setScanning(false);
            setStep(step - 1);
        }
    };

    const resetForm = () => {
        setStep(0);
        setForm({ name: '', nationality: '', passport: '', dob: '', visaType: '', visaExpiry: '', purpose: '', checkpoint: '' });
        setRiskResult(null);
        setScanning(false);
    };

    return (
        <div className="min-h-screen bg-navy-900 bg-grid">
            {/* Header */}
            <header className="mb-8 opacity-0 animate-fade-up">
                <h1 className="text-2xl font-bold text-white tracking-tight">New Traveler Entry</h1>
                <p className="text-sm text-gray-500 mt-0.5">Register a new border crossing entry</p>
            </header>

            <div className="max-w-3xl">
                <ProgressBar step={step} />

                {/* Form Card */}
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
                    {/* Step 1: Personal Info */}
                    {step === 0 && (
                        <div
                            key="step-0"
                            style={{
                                animation: `${slideDir === 'right' ? 'fadeUp' : 'fadeUp'} 0.4s ease-out`,
                            }}
                        >
                            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                <span className="text-accent">01</span> Personal Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <FloatingInput label="Full Legal Name" name="name" value={form.name} onChange={handleChange} />
                                </div>
                                <FloatingSelect label="Nationality" name="nationality" value={form.nationality} onChange={handleChange} options={nationalities} />
                                <FloatingInput label="Passport Number" name="passport" value={form.passport} onChange={handleChange} mono />
                                <FloatingInput label="Date of Birth" name="dob" value={form.dob} onChange={handleChange} type="date" />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Travel Info */}
                    {step === 1 && (
                        <div
                            key="step-1"
                            style={{
                                animation: 'fadeUp 0.4s ease-out',
                            }}
                        >
                            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                <span className="text-accent">02</span> Travel Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <FloatingSelect label="Visa Type" name="visaType" value={form.visaType} onChange={handleChange} options={visaTypes} />
                                <FloatingInput label="Visa Expiry Date" name="visaExpiry" value={form.visaExpiry} onChange={handleChange} type="date" />
                                <FloatingSelect label="Checkpoint" name="checkpoint" value={form.checkpoint} onChange={handleChange} options={checkpoints} />
                                <div className="md:col-span-2">
                                    <div className="relative">
                                        <textarea
                                            name="purpose"
                                            value={form.purpose}
                                            onChange={handleChange}
                                            placeholder=" "
                                            rows={3}
                                            required
                                            className="glass-input resize-none peer pt-6"
                                            style={{ background: 'rgba(15, 23, 42, 0.6)' }}
                                        />
                                        <label className="absolute left-4 top-6 text-sm text-gray-500 pointer-events-none transition-all duration-300 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-accent peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wider peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-accent peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-wider">
                                            Purpose of Visit
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: AI Risk Analysis */}
                    {step === 2 && (
                        <div
                            key="step-2"
                            style={{
                                animation: 'fadeUp 0.4s ease-out',
                            }}
                        >
                            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                <span className="text-accent">03</span> AI Risk Analysis
                            </h2>

                            {scanning && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="radar-scan mb-6">
                                        <div className="absolute inset-[20%] rounded-full border border-dashed border-accent/20" />
                                        <div className="absolute inset-[40%] rounded-full border border-dashed border-accent/10" />
                                    </div>
                                    <p className="text-accent font-semibold text-sm animate-pulse">AI is analyzing traveler profile...</p>
                                    <p className="text-gray-600 text-xs mt-1">Cross-referencing databases</p>
                                </div>
                            )}

                            {!scanning && riskResult && (
                                <div
                                    className="rounded-xl p-6"
                                    style={{
                                        background: 'rgba(15, 23, 42, 0.4)',
                                        border: `1px solid ${riskResult.color}30`,
                                        boxShadow: riskResult.level === 'HIGH' ? `0 0 30px ${riskResult.color}20` : 'none',
                                        animation: riskResult.level === 'HIGH' ? 'pulseGlowRed 2s ease-in-out infinite' : 'fadeUp 0.6s ease-out',
                                    }}
                                >
                                    <div className="flex items-start gap-8">
                                        <div className="flex-shrink-0">
                                            <RiskScoreRing score={riskResult.score} color={riskResult.color} />
                                        </div>
                                        <div className="flex-1 pt-2">
                                            <div className="flex items-center gap-3 mb-4">
                                                <span
                                                    className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider"
                                                    style={{
                                                        background: `${riskResult.color}15`,
                                                        color: riskResult.color,
                                                        border: `1px solid ${riskResult.color}30`,
                                                        boxShadow: `0 0 15px ${riskResult.color}25`,
                                                    }}
                                                >
                                                    {riskResult.level} RISK
                                                </span>
                                            </div>
                                            <h3 className="text-white font-semibold mb-2">Assessment Summary</h3>
                                            <p className="text-sm text-gray-400 leading-relaxed">{riskResult.reason}</p>

                                            <div className="mt-6 flex gap-3">
                                                <button className="btn-accent text-sm py-2" onClick={resetForm}>
                                                    Submit & New Entry
                                                </button>
                                                <button
                                                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 border border-glass-border hover:text-white hover:border-gray-500 transition-all duration-300"
                                                    onClick={resetForm}
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    {step < 2 && (
                        <div className="mt-8 flex items-center gap-4">
                            {step > 0 && (
                                <button
                                    onClick={prevStep}
                                    className="px-6 py-3 rounded-xl text-sm font-medium text-gray-400 border border-glass-border hover:text-white hover:border-gray-500 transition-all duration-300 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back
                                </button>
                            )}
                            <button onClick={nextStep} className="btn-accent flex items-center gap-2">
                                {step === 1 ? 'Run AI Analysis' : 'Next Step'}
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {step === 2 && !scanning && !riskResult && (
                        <div className="mt-8">
                            <button onClick={prevStep} className="px-6 py-3 rounded-xl text-sm font-medium text-gray-400 border border-glass-border hover:text-white hover:border-gray-500 transition-all duration-300 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                                Back
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
