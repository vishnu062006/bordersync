export default function TravelerTable({ travelers }) {
    const statusConfig = {
        CLEARED: {
            pill: 'pill-cleared',
            borderColor: '#22C55E',
            rowBg: 'transparent',
        },
        PENDING: {
            pill: 'pill-pending',
            borderColor: '#F59E0B',
            rowBg: 'transparent',
        },
        FLAGGED: {
            pill: 'pill-flagged',
            borderColor: '#EF4444',
            rowBg: 'rgba(239, 68, 68, 0.03)',
            rowGlow: '0 0 30px rgba(239, 68, 68, 0.05)',
        },
    };

    return (
        <div className="glass-card overflow-hidden animate-fade-up stagger-5">
            {/* Header */}
            <div className="px-6 py-4 border-b border-glass-border flex items-center justify-between">
                <div>
                    <h2 className="text-base font-semibold text-white">Live Traveler Feed</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Real-time checkpoint monitoring</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="pulse-dot-green" />
                    <span className="text-xs text-green-400 font-medium">Live</span>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-glass-border">
                            <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest">ID</th>
                            <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Traveler</th>
                            <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Nationality</th>
                            <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Passport</th>
                            <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Visa</th>
                            <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Checkpoint</th>
                            <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Time</th>
                            <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {travelers.map((t) => {
                            const config = statusConfig[t.status] || statusConfig.PENDING;
                            return (
                                <tr
                                    key={t.id}
                                    className="border-b border-glass-border/50 group cursor-default"
                                    style={{
                                        borderLeft: `3px solid ${config.borderColor}`,
                                        background: config.rowBg,
                                        boxShadow: config.rowGlow || 'none',
                                        transition: 'all 0.3s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = `0 4px 15px rgba(0,0,0,0.2), ${config.rowGlow || '0 0 0 transparent'}`;
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = config.rowGlow || 'none';
                                        e.currentTarget.style.background = config.rowBg;
                                    }}
                                >
                                    <td className="px-6 py-3.5 text-xs font-mono text-gray-400">{t.id}</td>
                                    <td className="px-6 py-3.5">
                                        <span className="text-sm font-medium text-white group-hover:text-accent transition-colors">{t.name}</span>
                                    </td>
                                    <td className="px-6 py-3.5 text-xs text-gray-400">{t.nationality}</td>
                                    <td className="px-6 py-3.5 text-xs font-mono text-gray-400">{t.passport}</td>
                                    <td className="px-6 py-3.5 text-xs text-gray-400">{t.visaType}</td>
                                    <td className="px-6 py-3.5 text-xs text-gray-400">{t.checkpoint}</td>
                                    <td className="px-6 py-3.5 text-xs font-mono text-gray-500">{t.entryTime}</td>
                                    <td className="px-6 py-3.5">
                                        <span className={config.pill}>{t.status}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-glass-border flex items-center justify-between">
                <p className="text-[10px] text-gray-500">
                    Showing <span className="text-white font-medium">{travelers.length}</span> entries
                </p>
                <p className="text-[10px] text-gray-500">
                    Refresh rate: <span className="text-green-400 font-medium">5s</span>
                </p>
            </div>
        </div>
    );
}
