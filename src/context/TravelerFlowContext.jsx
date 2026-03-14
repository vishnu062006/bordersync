import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'bordersync-traveler-flow';

const TravelerFlowContext = createContext(null);

function readStoredState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function TravelerFlowProvider({ children }) {
  const stored = readStoredState();
  const [draft, setDraft] = useState(stored?.draft || null);
  const [analysis, setAnalysis] = useState(stored?.analysis || null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ draft, analysis }));
  }, [draft, analysis]);

  const value = useMemo(() => ({
    draft,
    analysis,
    setDraft,
    clearDraft: () => setDraft(null),
    setAnalysis,
    clearAnalysis: () => setAnalysis(null),
  }), [analysis, draft]);

  return <TravelerFlowContext.Provider value={value}>{children}</TravelerFlowContext.Provider>;
}

export function useTravelerFlow() {
  const context = useContext(TravelerFlowContext);
  if (!context) throw new Error('useTravelerFlow must be used within TravelerFlowProvider');
  return context;
}
