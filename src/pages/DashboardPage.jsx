import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import TravelerTable from '../components/TravelerTable';

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState([]);
    const [travelers, setTravelers] = useState([]);
    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setError('Not authenticated.');
            setLoading(false);
            return;
        }
        let active = true;
        api.getDashboard()
            .then((data) => {
                if (!active) return;
                setStats(data.stats || []);
                setTravelers(data.travelers || []);
                setAgencies(data.agencies || []);
                setLoading(false);
            })
            .catch((err) => {
                if (!active) return;
                setError(err.message || 'Failed to load dashboard.');
                setLoading(false);
            });
        return () => { active = false; };
    }, [user, authLoading]);

    return (
        <div className="min-h-screen bg-navy-900 bg-grid">
            {loading && (
                <div className="glass-card p-4 text-sm text-gray-400 mb-6">Loading dashboard...</div>
            )}
            {error && (
                <div className="glass-card p-4 text-sm text-red-400 mb-6">{error}</div>
            )}
            {/* Header */}
            <header className="mb-8 opacity-0 animate-fade-up">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Command Center</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Real-time border operations overview</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="glass-card px-4 py-2 flex items-center gap-2">
                            <span className="pulse-dot-green" />
                            <span className="text-xs text-gray-400 font-medium">
                                {agencies.filter(a => a.status === 'online').length} agencies active
                            </span>
                        </div>
                        <div className="glass-card px-4 py-2">
                            <span className="text-xs font-mono text-gray-400">
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {stats.map((stat, i) => (
                    <StatCard key={stat.id} stat={stat} index={i} />
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
                {/* Traveler Table */}
                <div className="xl:col-span-3">
                    <TravelerTable travelers={travelers} />
                </div>

                {/* Agencies Panel */}
                <div className="xl:col-span-1">
                    <div className="glass-card p-5 opacity-0 animate-fade-up stagger-6">
                        <h3 className="text-sm font-semibold text-white mb-4">Connected Agencies</h3>
                        <ul className="space-y-2">
                            {agencies.map((agency) => (
                                <li
                                    key={agency.id}
                                    className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-transparent transition-all duration-300 cursor-default"
                                    style={{
                                        opacity: agency.status === 'online' ? 1 : 0.45,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                        e.currentTarget.style.borderColor = agency.status === 'online'
                                            ? 'rgba(34, 197, 94, 0.15)'
                                            : 'rgba(239, 68, 68, 0.15)';
                                        e.currentTarget.style.boxShadow = agency.status === 'online'
                                            ? '0 0 15px rgba(34, 197, 94, 0.08)'
                                            : '0 0 15px rgba(239, 68, 68, 0.08)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.borderColor = 'transparent';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className={agency.status === 'online' ? 'pulse-dot-green' : 'pulse-dot-red'} />
                                        <span className="text-xs text-gray-300 font-medium">{agency.name}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-mono">
                                        {agency.agents > 0 ? `${agency.agents} agents` : 'offline'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
