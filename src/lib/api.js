import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function authFetch(path, options = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const token = await user.getIdToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    let message = 'Request failed';
    let fieldErrors;
    try {
      const data = await res.json();
      message = data.error || message;
      fieldErrors = data.fields;
    } catch {
      // ignore
    }
    const error = new Error(message);
    if (fieldErrors && typeof fieldErrors === 'object') {
      error.fields = fieldErrors;
    }
    throw error;
  }

  return res.json();
}

export const api = {
  getDashboard: () => authFetch('/api/dashboard'),
  getAlerts: () => authFetch('/api/alerts'),
  getMeta: () => authFetch('/api/meta'),
  createEntry: (payload) => authFetch('/api/entries', { method: 'POST', body: JSON.stringify(payload) }),
  ackAlert: (id) => authFetch(`/api/alerts/${id}/ack`, { method: 'POST' }),
  generateRiskNarrative: (payload) => authFetch('/api/risk-analysis/explain', { method: 'POST', body: JSON.stringify(payload) }),
};
