import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bot, FileWarning, ShieldCheck, Sparkles } from 'lucide-react';
import RiskGauge from '../components/RiskGauge';
import { useTravelerFlow } from '../context/TravelerFlowContext';
import { api } from '../lib/api';
import { evaluateTravelerRisk } from '../lib/riskEngine';

const categoryMeta = {
  passportVisa: {
    label: 'Passport + Visa Risk',
    help: 'Checks whether passport and visa dates, validity windows, and visa-purpose pairing are compliant.',
  },
  travelConsistency: {
    label: 'Travel Consistency Risk',
    help: 'Measures whether travel dates, stay length, accommodation details, and timing align logically.',
  },
  immigrationHistory: {
    label: 'Immigration History Risk',
    help: 'Assesses prior visa denials, overstays, deportation history, and criminal record declarations.',
  },
  tripPlausibility: {
    label: 'Trip Plausibility Risk',
    help: 'Looks at whether the declared purpose, length of stay, and travel pattern make practical sense together.',
  },
  dataIntegrity: {
    label: 'Data Integrity Risk',
    help: 'Captures missing, contradictory, or invalid structured inputs that reduce confidence in the record.',
  },
};

function BreakdownCard({ categoryKey, value }) {
  const meta = categoryMeta[categoryKey];
  const tone = value >= 81 ? 'text-red-400' : value >= 61 ? 'text-orange-400' : value >= 41 ? 'text-yellow-400' : value >= 21 ? 'text-amber-400' : 'text-green-400';

  return (
    <div className="glass-card p-4 group relative">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">{meta.label}</h3>
        <span className={`text-lg font-bold ${tone}`}>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            background: value >= 81 ? '#EF4444' : value >= 61 ? '#F97316' : value >= 41 ? '#EAB308' : value >= 21 ? '#F59E0B' : '#22C55E',
          }}
        />
      </div>
      <div
        className="absolute left-4 right-4 top-4 z-20 rounded-xl border border-white/10 px-4 py-3 text-xs text-gray-200 opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: 'rgba(5,10,20,0.97)', boxShadow: '0 14px 30px rgba(0,0,0,0.38)' }}
      >
        {meta.help}
      </div>
    </div>
  );
}

function TravelerPicker({ entries, onSelect, selectedId, loading }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-accent" />
        <h2 className="text-sm font-semibold text-white">Select Traveler for AI Risk Analysis</h2>
      </div>
      {loading ? (
        <p className="text-sm text-gray-400">Loading traveler records...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-500">No traveler entries are available yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {entries.map((entry) => {
            const isSelected = selectedId === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelect(entry)}
                className="text-left rounded-2xl p-4 transition-all duration-300"
                style={{
                  background: isSelected ? 'rgba(232,93,26,0.12)' : 'rgba(255,255,255,0.02)',
                  border: isSelected ? '1px solid rgba(232,93,26,0.35)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{entry.fullName || entry.name}</p>
                    <p className="text-[11px] text-gray-500 mt-1">{entry.id}</p>
                  </div>
                  <span
                    className="text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded-full"
                    style={{
                      color: entry.status === 'FLAGGED' ? '#FCA5A5' : entry.status === 'PENDING' ? '#FCD34D' : '#86EFAC',
                      background: entry.status === 'FLAGGED' ? 'rgba(239,68,68,0.12)' : entry.status === 'PENDING' ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)',
                    }}
                  >
                    {entry.status}
                  </span>
                </div>
                <div className="space-y-2 text-xs text-gray-400">
                  <p>{entry.destinationCountry} • {entry.purposeOfVisit || entry.purpose || '-'}</p>
                  <p>{entry.arrivalDate} to {entry.departureDate}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RiskAnalysisPage() {
  const { analysis, setAnalysis } = useTravelerFlow();
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [localNarrative, setLocalNarrative] = useState(null);
  const [aiError, setAiError] = useState('');

  const traveler = analysis?.traveler;
  const result = analysis?.result;
  const entry = analysis?.entry;
  const aiSummary = analysis?.narrative || localNarrative;

  useEffect(() => {
    let active = true;
    api.getEntries()
      .then((response) => {
        if (!active) return;
        setEntries(response.entries || []);
        setLoadingEntries(false);
      })
      .catch(() => {
        if (!active) return;
        setEntries([]);
        setLoadingEntries(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!traveler || !result || aiSummary) return;
    let active = true;
    api.generateRiskNarrative({ traveler, result })
      .then((response) => {
        if (!active) return;
        setLocalNarrative(response?.insight || null);
        setAnalysis((prev) => (prev ? { ...prev, narrative: response?.insight || null } : prev));
      })
      .catch((error) => {
        if (!active) return;
        setAiError(error.message || 'Unable to load Gemini summary.');
      });
    return () => {
      active = false;
    };
  }, [aiSummary, result, setAnalysis, traveler]);

  const summaryItems = useMemo(() => (
    traveler ? [
      { label: 'Traveler', value: traveler.fullName || traveler.name },
      { label: 'Destination', value: traveler.destinationCountry },
      { label: 'Purpose', value: traveler.purposeOfVisit || traveler.purpose },
      { label: 'Visa Type', value: traveler.visaType },
      { label: 'Arrival', value: traveler.arrivalDate },
      { label: 'Departure', value: traveler.departureDate },
      { label: 'Stay', value: `${traveler.stayDurationDays} days` },
      { label: 'Entry ID', value: entry?.id || traveler.id || 'Pending assignment' },
    ] : []
  ), [entry?.id, traveler]);

  const handleSelectTraveler = (selectedEntry) => {
    setLocalNarrative(null);
    setAiError('');
    const computed = evaluateTravelerRisk(selectedEntry);
    setAnalysis({
      traveler: selectedEntry,
      entry: selectedEntry,
      result: computed,
      narrative: null,
    });
  };

  return (
    <div className="min-h-screen bg-navy-900 bg-grid">
      <header className="mb-8 opacity-0 animate-fade-up">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="text-[11px] uppercase tracking-[0.24em] text-white/55">AI Risk Analysis</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Traveler Risk Review</h1>
            <p className="text-sm text-gray-500 mt-1">Select a traveler record to compute and review the latest AI-assisted risk explanation.</p>
          </div>
          {result && (
            <div className="glass-card px-5 py-4">
              <p className="text-xs text-gray-500 uppercase tracking-[0.2em] mb-1">Recommended Action</p>
              <p className="text-base font-semibold text-white">{result.recommendedAction}</p>
            </div>
          )}
        </div>
      </header>

      <TravelerPicker
        entries={entries}
        loading={loadingEntries}
        onSelect={handleSelectTraveler}
        selectedId={entry?.id || traveler?.id}
      />

      {!traveler || !result ? null : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-6">
            <div className="xl:col-span-4">
              <RiskGauge score={result.overallRisk} label={result.riskBand} tone={result.tone} />
            </div>

            <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(result.breakdown).map(([key, value]) => (
                <BreakdownCard key={key} categoryKey={key} value={value} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-6">
            <div className="xl:col-span-4">
              <div className="glass-card p-5 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  <h2 className="text-sm font-semibold text-white">Traveler Summary</h2>
                </div>
                <div className="space-y-3">
                  {summaryItems.map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-4 text-sm">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="text-white text-right">{item.value || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="xl:col-span-4">
              <div className="glass-card p-5 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <h2 className="text-sm font-semibold text-white">Top Risk Drivers</h2>
                </div>
                <div className="space-y-3">
                  {result.reasons.length > 0 ? result.reasons.map((reason) => (
                    <div key={reason} className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-gray-200">
                      {reason}
                    </div>
                  )) : (
                    <p className="text-sm text-gray-500">No material risk drivers were detected.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="xl:col-span-4">
              <div className="glass-card p-5 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <FileWarning className="w-4 h-4 text-yellow-400" />
                  <h2 className="text-sm font-semibold text-white">Compliance Warnings</h2>
                </div>
                <div className="space-y-3">
                  {result.warnings.length > 0 ? result.warnings.map((warning) => (
                    <div key={warning} className="rounded-xl border border-yellow-500/10 bg-yellow-500/[0.04] px-4 py-3 text-sm text-yellow-100">
                      {warning}
                    </div>
                  )) : (
                    <p className="text-sm text-gray-500">No compliance warnings were triggered.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 mt-6">
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-semibold text-white">Gemini Admin Narrative</h2>
              </div>
              {!aiSummary && !aiError && <p className="text-sm text-gray-400">Generating Gemini summary...</p>}
              {aiError && <p className="text-sm text-red-400">{aiError}</p>}
              {aiSummary && !aiError && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-200 leading-7">{aiSummary.summary}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500 mb-2">Operational Note</p>
                      <p className="text-sm text-gray-200">{aiSummary.operationalNote}</p>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500 mb-2">Next Review Focus</p>
                      <p className="text-sm text-gray-200">{aiSummary.reviewFocus}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
