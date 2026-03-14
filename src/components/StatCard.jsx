import { useEffect, useRef } from 'react';
import { AlertTriangle, Building2, ClipboardList, Users } from 'lucide-react';

const colorMap = {
    accent: {
        text: 'text-accent',
        glow: 'glow-text',
        bg: 'from-accent/20 to-accent/5',
        border: '#E85D1A',
        shadow: '0 0 20px rgba(232, 93, 26, 0.3)',
    },
    yellow: {
        text: 'text-yellow-400',
        glow: 'glow-text-yellow',
        bg: 'from-yellow-400/20 to-yellow-400/5',
        border: '#F59E0B',
        shadow: '0 0 20px rgba(245, 158, 11, 0.3)',
    },
    red: {
        text: 'text-red-400',
        glow: 'glow-text-red',
        bg: 'from-red-400/20 to-red-400/5',
        border: '#EF4444',
        shadow: '0 0 20px rgba(239, 68, 68, 0.3)',
    },
    green: {
        text: 'text-green-400',
        glow: 'glow-text-green',
        bg: 'from-green-400/20 to-green-400/5',
        border: '#22C55E',
        shadow: '0 0 20px rgba(34, 197, 94, 0.3)',
    },
};

export default function StatCard({ stat, index }) {
    const cardRef = useRef(null);
    const colors = colorMap[stat.color] || colorMap.accent;
    const iconMap = {
        1: ClipboardList,
        2: Users,
        3: AlertTriangle,
        4: Building2,
    };
    const Icon = iconMap[stat.id] || ClipboardList;

    useEffect(() => {
        const el = cardRef.current;
        if (!el) return;

        const handleMouseMove = (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;
            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        };

        const handleMouseLeave = () => {
            el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        };

        el.addEventListener('mousemove', handleMouseMove);
        el.addEventListener('mouseleave', handleMouseLeave);
        return () => {
            el.removeEventListener('mousemove', handleMouseMove);
            el.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <div
            ref={cardRef}
            className={`glass-card gradient-border p-6 opacity-0 animate-fade-up stagger-${index + 1} overflow-hidden`}
            style={{
                transition: 'transform 0.15s ease-out, box-shadow 0.3s ease',
                borderTop: `3px solid ${colors.border}`,
            }}
        >
            {/* Shimmer overlay */}
            <div className="shimmer-overlay" style={{ '--shimmer-delay': `${index * 0.5}s` }} />

            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colors.bg} flex items-center justify-center text-2xl`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                {stat.changeType === 'live' ? (
                    <div className="flex items-center gap-1.5">
                        <span className="pulse-dot-green" />
                        <span className="text-xs text-green-400 font-semibold">{stat.change}</span>
                    </div>
                ) : (
                    <span className={`text-xs font-semibold ${stat.changeType === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                        {stat.change}
                    </span>
                )}
            </div>
            <p
                className={`text-3xl font-extrabold ${colors.text} tracking-tight relative z-10`}
                style={{ textShadow: colors.shadow }}
            >
                {stat.value}
            </p>
            <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider relative z-10">
                {stat.label}
            </p>
        </div>
    );
}
