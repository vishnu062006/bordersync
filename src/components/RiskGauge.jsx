export default function RiskGauge({ score, label, tone }) {
  const colorMap = {
    green: '#22C55E',
    amber: '#F59E0B',
    yellow: '#EAB308',
    orange: '#F97316',
    red: '#EF4444',
  };

  const color = colorMap[tone] || colorMap.orange;
  const angle = Math.max(0, Math.min(100, score)) * 3.6;

  return (
    <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[280px]">
      <div
        className="w-44 h-44 rounded-full flex items-center justify-center"
        style={{
          background: `conic-gradient(${color} ${angle}deg, rgba(255,255,255,0.08) ${angle}deg 360deg)`,
          boxShadow: `0 0 30px ${color}22`,
        }}
      >
        <div
          className="w-32 h-32 rounded-full flex flex-col items-center justify-center border border-white/10"
          style={{ background: 'rgba(11,17,32,0.94)' }}
        >
          <div className="text-4xl font-black text-white">{score}%</div>
          <div className="text-[11px] uppercase tracking-[0.25em]" style={{ color }}>
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}
