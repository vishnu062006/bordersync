import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bot, FileWarning, ShieldCheck, Sparkles } from 'lucide-react';
import RiskGauge from '../components/RiskGauge';
import { useTravelerFlow } from '../context/TravelerFlowContext';
import { api } from '../lib/api';

const categoryLabels = {
  passportVisa: 'Passport + Visa Risk',
  travelConsistency: 'Travel Consistency Risk',
  immigrationHistory: 'Immigration History Risk',
  tripPlausibility: 'Trip Plausibility Risk',
  dataIntegrity: 'Data Integrity Risk',
};

function BreakdownCard({ label, value }) {
  const tone = value >= 81 ? 'text-red-400' : value >= 61 ? 'text-orange-400' : value >= 41 ? 'text-yellow-400' : value >= 21 ? 'text-amber-400' : 'text-green-400';
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">{label}</h3>
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
    </div>
  );
}

export default function RiskAnalysisPage() {
  const { analysis, setAnalysis } = useTravelerFlow();
  const [aiSummary, setAiSummary] = useState(analysis?.narrative || null);
  const [aiError, setAiError] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const traveler = analysis?.traveler;
  const result = analysis?.result;
  const entry = analysis?.entry;

  useEffect(() => {
    if (!traveler || !result || aiSummary) return;
    let active = true;
    api.generateRiskNarrative({ traveler, result })
      .then((response) => {
        if (!active) return;
        setAiSummary(response?.insight || null);
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
      { label: 'Traveler', value: traveler.fullName },
      { label: 'Destination', value: traveler.destinationCountry },
      { label: 'Purpose', value: traveler.purposeOfVisit },
      { label: 'Visa Type', value: traveler.visaType },
      { label: 'Arrival', value: traveler.arrivalDate },
      { label: 'Departure', value: traveler.departureDate },
      { label: 'Stay', value: `${traveler.stayDurationDays} days` },
      { label: 'Entry ID', value: entry?.id || 'Pending assignment' },
    ] : []
  ), [entry?.id, traveler]);

  if (!traveler || !result) {
    return (
      <div className="min-h-screen bg-navy-900 bg-grid">
        <div className="glass-card p-8 max-w-2xl">
          <h1 className="text-2xl font-bold text-white mb-3">AI Risk Analysis</h1>
          <p className="text-sm text-gray-400">
            No traveler analysis is available yet. Submit a traveler intake record to generate the final risk assessment screen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 bg-grid">
      <header className="mb-8 opacity-0 animate-fade-up">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="text-[11px] uppercase tracking-[0.24em] text-white/55">AI Risk Analysis</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{traveler.fullName}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {traveler.destinationCountry} • {traveler.purposeOfVisit} • {entry?.id || 'Draft analysis'}
            </p>
          </div>
          <div className="glass-card px-5 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-[0.2em] mb-1">Recommended Action</p>
            <p className="text-base font-semibold text-white">{result.recommendedAction}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4">
          <RiskGauge score={result.overallRisk} label={result.riskBand} tone={result.tone} />
        </div>

        <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(result.breakdown).map(([key, value]) => (
            <BreakdownCard key={key} label={categoryLabels[key]} value={value} />
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

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-6">
        <div className="xl:col-span-7">
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
                {!aiSummary.enabled && (
                  <p className="text-xs text-gray-500">
                    Gemini explanation is unavailable right now. Showing the deterministic fallback summary instead.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-5">
          <div className="glass-card p-5 h-full">
            <h2 className="text-sm font-semibold text-white mb-4">Admin Note</h2>
            <textarea
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              placeholder="Officer note placeholder for escalation comments, supervisor review, or final disposition."
              className="glass-input min-h-[220px] resize-none"
              style={{ background: 'rgba(15, 23, 42, 0.6)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
