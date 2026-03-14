import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const severityConfig = {
    CRITICAL: {
        dot: 'bg-red-500',
        text: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        borderColor: '#EF4444',
        bgTint: 'rgba(239, 68, 68, 0.04)',
        glowAnim: 'pulseGlowRed',
        label: 'CRITICAL',
    },
    HIGH: {
        dot: 'bg-orange-500',
        text: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/30',
        borderColor: '#F97316',
        bgTint: 'rgba(249, 115, 22, 0.03)',
        glowAnim: '',
        label: 'HIGH',
    },
    MEDIUM: {
        dot: 'bg-yellow-500',
        text: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        borderColor: '#F59E0B',
        bgTint: 'rgba(245, 158, 11, 0.02)',
        glowAnim: '',
        label: 'MEDIUM',
    },
    LOW: {
        dot: 'bg-blue-500',
        text: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        borderColor: '#3B82F6',
        bgTint: 'transparent',
        glowAnim: '',
        label: 'LOW',
    },
};

const typeLabels = {
    DOCUMENT_MISMATCH: '📄 Document Mismatch',
    WATCHLIST_HIT: '🚨 Watchlist Hit',
    VISA_ANOMALY: '⚠️ Visa Anomaly',
    OVERSTAY_RISK: '⏰ Overstay Risk',
    LUGGAGE_ALERT: '🧳 Luggage Alert',
};

export default function AlertsPage() {
    const { user, loading: authLoading } = useAuth();
    const [acknowledgedMap, setAcknowledgedMap] = useState({});
    const [alerts, setAlerts] = useState([]);
    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const isUnauthenticated = !authLoading && !user;

    useEffect(() => {
        if (authLoading || !user) return;
        let active = true;
        api.getAlerts()
            .then((data) => {
                if (!active) return;
                setAlerts(data.alerts || []);
                setAgencies(data.agencies || []);
                setLoading(false);
            })
            .catch((err) => {
                if (!active) return;
                setError(err.message || 'Failed to load alerts.');
                setLoading(false);
            });
        return () => { active = false; };
    }, [user, authLoading]);

    const pageLoading = authLoading || (!isUnauthenticated && loading);
    const pageError = isUnauthenticated ? 'Not authenticated.' : error;

    const sortedAlerts = [...alerts].sort((a, b) => {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return order[a.severity] - order[b.severity];
    });

    const unacknowledged = alerts.filter(
        (a) => !a.acknowledged && !acknowledgedMap[a.id]
    ).length;

    const handleAcknowledge = async (alertId) => {
        setAcknowledgedMap((prev) => ({ ...prev, [alertId]: true }));
        try {
            await api.ackAlert(alertId);
        } catch {
            setAcknowledgedMap((prev) => ({ ...prev, [alertId]: false }));
            setError('Failed to acknowledge alert.');
        }
    };

    // Simulated agency acknowledgment status
    const getAgencyForAlert = (alert) => {
        const agency = agencies.find((a) => a.name === alert.agency);
        return agency || { name: alert.agency, status: 'online' };
    };

    return (
        <div className="min-h-screen bg-navy-900 bg-grid">
            {pageLoading && (
                <div className="glass-card p-4 text-sm text-gray-400 mb-6">Loading alerts...</div>
            )}
            {pageError && (
                <div className="glass-card p-4 text-sm text-red-400 mb-6">{pageError}</div>
            )}
            {/* Header */}
            <header className="mb-8 opacity-0 animate-fade-up">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Threat Intelligence Feed</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Real-time flagged traveler monitoring & agency coordination</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="glass-card px-4 py-2 flex items-center gap-2" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                            <span className="pulse-dot-red" />
                            <span className="text-xs text-red-400 font-semibold">{unacknowledged} unacknowledged</span>
                        </div>
                        <div
                            className="flex items-center gap-2 px-4 py-2 rounded-2xl"
                            style={{
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.15)',
                            }}
                        >
                            <span className="pulse-dot-red" />
                            <span className="text-xs text-red-400 font-bold uppercase tracking-wider">LIVE</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 xl:grid-cols-10 gap-6">
                {/* Left: Alert Feed (70%) */}
                <div className="xl:col-span-7 space-y-4">
                    {sortedAlerts.map((alert, i) => {
                        const sev = severityConfig[alert.severity];
                        const isAcked = alert.acknowledged || acknowledgedMap[alert.id];

                        return (
                            <div
                                key={alert.id}
                                className="rounded-2xl p-6 opacity-0 animate-slide-down"
                                style={{
                                    animationDelay: `${i * 0.1}s`,
                                    animationFillMode: 'forwards',
                                    background: sev.bgTint,
                                    backdropFilter: 'blur(12px)',
                                    border: `1px solid ${sev.borderColor}30`,
                                    borderLeft: `4px solid ${sev.borderColor}`,
                                    boxShadow: (alert.severity === 'CRITICAL' || alert.severity === 'HIGH')
                                        ? `0 0 20px ${sev.borderColor}10`
                                        : '0 4px 15px rgba(0,0,0,0.2)',
                                    animation: alert.severity === 'CRITICAL'
                                        ? `slideDown 0.5s ease-out ${i * 0.1}s forwards, pulseGlowRed 3s ease-in-out infinite`
                                        : undefined,
                                }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl ${sev.bg} flex items-center justify-center`}>
                                            <span className={`w-3 h-3 rounded-full ${sev.dot} ${alert.severity === 'CRITICAL' ? 'animate-pulse' : ''}`} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-white">{alert.travelerName}</span>
                                                <span
                                                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                                    style={{
                                                        background: `${sev.borderColor}15`,
                                                        color: sev.borderColor,
                                                        border: `1px solid ${sev.borderColor}30`,
                                                        boxShadow: `0 0 8px ${sev.borderColor}20`,
                                                    }}
                                                >
                                                    {sev.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {alert.travelerId} · {alert.nationality} · {typeLabels[alert.type] || alert.type}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xs font-mono text-gray-500">{alert.timestamp}</p>
                                        <p className="text-[10px] text-gray-600 mt-0.5">{alert.id}</p>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-300 leading-relaxed mb-4 pl-[52px]">{alert.message}</p>

                                <div className="flex items-center justify-between pl-[52px]">
                                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider flex items-center gap-1.5">
                                        <span
                                            className="inline-block w-1.5 h-1.5 rounded-full"
                                            style={{ background: sev.borderColor }}
                                        />
                                        📡 {alert.agency}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {isAcked ? (
                                            <span className="text-[10px] text-green-400 font-medium flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                                Acknowledged
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleAcknowledge(alert.id)}
                                                className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-accent bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-all duration-300 uppercase tracking-wider"
                                            >
                                                Acknowledge
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Right: Agency Broadcast Panel (30%) */}
                <div className="xl:col-span-3">
                    <div
                        className="glass-card p-5 sticky top-8 opacity-0 animate-fade-up stagger-3"
                    >
                        <h3 className="text-sm font-semibold text-white mb-1">Agency Broadcast</h3>
                        <p className="text-[10px] text-gray-600 mb-5">Alert distribution & acknowledgement status</p>

                        <ul className="space-y-3">
                            {alerts.map((alert) => {
                                const sev = severityConfig[alert.severity];
                                const agency = getAgencyForAlert(alert);
                                const isAcked = alert.acknowledged || acknowledgedMap[alert.id];

                                return (
                                    <li
                                        key={alert.id}
                                        className="rounded-lg p-3 transition-all duration-300"
                                        style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.04)',
                                        }}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ background: sev.borderColor }}
                                                />
                                                <span className="text-xs text-white font-medium truncate max-w-[140px]">
                                                    {alert.travelerName}
                                                </span>
                                            </div>
                                            <span
                                                className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                                                style={{
                                                    background: `${sev.borderColor}15`,
                                                    color: sev.borderColor,
                                                }}
                                            >
                                                {sev.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-gray-500 truncate max-w-[130px]">
                                                → {agency.name}
                                            </span>
                                            {isAcked ? (
                                                <span
                                                    className="inline-flex items-center gap-1 text-[10px] text-green-400 font-medium"
                                                    style={{ animation: 'checkIn 0.5s ease-out' }}
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    ACK
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] text-yellow-500">
                                                    <svg
                                                        className="w-3 h-3"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        style={{ animation: 'spinLoader 1s linear infinite' }}
                                                    >
                                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20" />
                                                    </svg>
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
