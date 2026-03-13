import { useState, useEffect, useRef, useCallback, memo, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Circle, Shield, Lock, ArrowRight } from 'lucide-react';
import { animate } from 'motion/react';

const Spline = lazy(() => import('@splinetool/react-spline'));

// ── GlowingEffect (21st.dev, adapted for plain JS + orange palette) ───────────
const GlowingEffect = memo(({
    blur = 0, inactiveZone = 0.7, proximity = 0, spread = 20,
    glow = false, className = '', movementDuration = 2, borderWidth = 1, disabled = false,
}) => {
    const containerRef = useRef(null);
    const lastPosition = useRef({ x: 0, y: 0 });
    const animationFrameRef = useRef(0);

    const handleMove = useCallback((e) => {
        if (!containerRef.current) return;
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = requestAnimationFrame(() => {
            const el = containerRef.current;
            if (!el) return;
            const { left, top, width, height } = el.getBoundingClientRect();
            const mouseX = e?.x ?? lastPosition.current.x;
            const mouseY = e?.y ?? lastPosition.current.y;
            if (e) lastPosition.current = { x: mouseX, y: mouseY };
            const center = [left + width * 0.5, top + height * 0.5];
            const dist = Math.hypot(mouseX - center[0], mouseY - center[1]);
            const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone;
            if (dist < inactiveRadius) { el.style.setProperty('--active', '0'); return; }
            const isActive = mouseX > left - proximity && mouseX < left + width + proximity &&
                mouseY > top - proximity && mouseY < top + height + proximity;
            el.style.setProperty('--active', isActive ? '1' : '0');
            if (!isActive) return;
            const currentAngle = parseFloat(el.style.getPropertyValue('--start')) || 0;
            const targetAngle = (180 * Math.atan2(mouseY - center[1], mouseX - center[0])) / Math.PI + 90;
            const angleDiff = ((targetAngle - currentAngle + 180) % 360) - 180;
            animate(currentAngle, currentAngle + angleDiff, {
                duration: movementDuration,
                ease: [0.16, 1, 0.3, 1],
                onUpdate: (v) => el.style.setProperty('--start', String(v)),
            });
        });
    }, [inactiveZone, proximity, movementDuration]);

    useEffect(() => {
        if (disabled) return;
        const onScroll = () => handleMove();
        const onPointer = (e) => handleMove(e);
        window.addEventListener('scroll', onScroll, { passive: true });
        document.body.addEventListener('pointermove', onPointer, { passive: true });
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            window.removeEventListener('scroll', onScroll);
            document.body.removeEventListener('pointermove', onPointer);
        };
    }, [handleMove, disabled]);

    return (
        <>
            <div className={`pointer-events-none absolute -inset-px rounded-[inherit] border border-white/10 transition-opacity ${glow ? 'opacity-100' : 'opacity-0'} ${disabled ? '!block' : 'hidden'}`} />
            <div
                ref={containerRef}
                style={{
                    '--blur': `${blur}px`,
                    '--spread': spread,
                    '--start': '0',
                    '--active': '0',
                    '--glowingeffect-border-width': `${borderWidth}px`,
                    '--repeating-conic-gradient-times': '5',
                    '--gradient': `radial-gradient(circle, #E85D1A 10%, transparent 20%),
            radial-gradient(circle at 40% 40%, #FF7A3D 5%, transparent 15%),
            radial-gradient(circle at 60% 60%, #E85D1A 10%, transparent 20%),
            radial-gradient(circle at 40% 60%, #FF9A5C 10%, transparent 20%),
            repeating-conic-gradient(from 236.84deg at 50% 50%,
              #E85D1A 0%,
              #FF7A3D calc(25% / var(--repeating-conic-gradient-times)),
              #FFB347 calc(50% / var(--repeating-conic-gradient-times)),
              #E85D1A calc(75% / var(--repeating-conic-gradient-times)),
              #FF7A3D calc(100% / var(--repeating-conic-gradient-times)))`,
                }}
                className={`pointer-events-none absolute inset-0 rounded-[inherit] opacity-100 transition-opacity ${blur > 0 ? 'blur-[var(--blur)]' : ''} ${className} ${disabled ? '!hidden' : ''}`}
            >
                <div className={[
                    'glow rounded-[inherit]',
                    'after:content-[""] after:rounded-[inherit] after:absolute after:inset-[calc(-1*var(--glowingeffect-border-width))]',
                    'after:[border:var(--glowingeffect-border-width)_solid_transparent]',
                    'after:[background:var(--gradient)] after:[background-attachment:fixed]',
                    'after:opacity-[var(--active)] after:transition-opacity after:duration-300',
                    'after:[mask-clip:padding-box,border-box]',
                    'after:[mask-composite:intersect]',
                    'after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]',
                ].join(' ')} />
            </div>
        </>
    );
});

// ── Floating geometric shape ──────────────────────────────────────────────────
function ElegantShape({ className, delay = 0, width = 400, height = 100, rotate = 0, gradient = 'from-white/[0.08]' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -150, rotate: rotate - 15 }}
            animate={{ opacity: 1, y: 0, rotate }}
            transition={{ duration: 2.4, delay, ease: [0.23, 0.86, 0.39, 0.96], opacity: { duration: 1.2 } }}
            className={`absolute ${className}`}
        >
            <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width, height }}
                className="relative"
            >
                <div className={`absolute inset-0 rounded-full bg-gradient-to-r to-transparent ${gradient} backdrop-blur-[2px] border-2 border-white/[0.12]`} />
            </motion.div>
        </motion.div>
    );
}

// ── Dashboard preview ─────────────────────────────────────────────────────────
function DashboardPreview() {
    const stats = [
        { label: 'Total Entries', value: '12,847', color: '#E85D1A' },
        { label: 'Pending Review', value: '284', color: '#F5A623' },
        { label: 'Flagged', value: '47', color: '#E84040' },
        { label: 'Agencies Online', value: '23', color: '#2ECC71' },
    ];
    const rows = [
        { name: 'Elena Vasquez', nat: 'Mexico', status: 'CLEARED', col: '#2ECC71' },
        { name: 'Alexei Petrov', nat: 'Russia', status: 'PENDING', col: '#F5A623' },
        { name: 'Hans Mueller', nat: 'Germany', status: 'FLAGGED', col: '#E84040' },
        { name: 'Yuki Tanaka', nat: 'Japan', status: 'CLEARED', col: '#2ECC71' },
    ];
    return (
        <div className="w-full h-full p-5 flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-white font-bold text-sm">Command Center</p>
                    <p className="text-white/30 text-xs">Real-time border operations</p>
                </div>
                <span className="flex items-center gap-1.5 text-green-400 text-xs font-mono">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />6 agencies active
                </span>
            </div>
            <div className="grid grid-cols-4 gap-3">
                {stats.map((s, i) => (
                    <div key={i} className="rounded-xl p-3"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderTop: `2px solid ${s.color}` }}>
                        <p className="text-white/40 text-[9px] uppercase tracking-wider mb-1">{s.label}</p>
                        <p className="font-bold text-xl leading-none" style={{ color: s.color, textShadow: `0 0 20px ${s.color}55` }}>{s.value}</p>
                    </div>
                ))}
            </div>
            <div className="flex-1 rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
                    <p className="text-white/70 text-xs font-semibold">Live Traveler Feed</p>
                    <span className="flex items-center gap-1.5 text-green-400 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Live
                    </span>
                </div>
                <table className="w-full text-xs">
                    <thead>
                        <tr className="text-white/25 uppercase text-[9px] tracking-wider">
                            <th className="text-left px-4 py-2 font-medium">Traveler</th>
                            <th className="text-left px-4 py-2 font-medium">Nationality</th>
                            <th className="text-left px-4 py-2 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={i} className="border-t border-white/[0.03]"
                                style={{ borderLeft: r.status === 'FLAGGED' ? `2px solid ${r.col}` : '2px solid transparent' }}>
                                <td className="px-4 py-2.5 text-white font-medium">{r.name}</td>
                                <td className="px-4 py-2.5 text-white/40">{r.nat}</td>
                                <td className="px-4 py-2.5">
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                                        style={{ background: `${r.col}18`, color: r.col, boxShadow: `0 0 8px ${r.col}30` }}>
                                        {r.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── 3D Scroll reveal ──────────────────────────────────────────────────────────
function ScrollReveal() {
    const containerRef = useRef(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const onScroll = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const p = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight * 0.8)));
            setProgress(p);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div style={{ background: 'linear-gradient(to bottom, #030712, #0B1120)' }} className="pb-32 pt-4">
            <div className="max-w-4xl mx-auto px-6 text-center mb-10">
                <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }} viewport={{ once: true }}
                    className="text-[11px] uppercase tracking-[4px] mb-3" style={{ color: 'rgba(232,93,26,0.6)' }}>
                    Live Command Center
                </motion.p>
                <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }} viewport={{ once: true }}
                    className="text-3xl font-bold text-white/75">
                    See BorderSync in action
                </motion.h2>
                <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity }} className="mt-4">
                    <ArrowRight className="mx-auto rotate-90 w-4 h-4" style={{ color: 'rgba(232,93,26,0.4)' }} />
                </motion.div>
            </div>

            <div ref={containerRef} className="max-w-4xl mx-auto px-6" style={{ perspective: '1200px' }}>
                <div style={{
                    transform: `rotateX(${22 - progress * 22}deg) scale(${0.88 + progress * 0.12})`,
                    transformOrigin: 'center top',
                    transition: 'transform 0.08s ease-out',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.07)',
                    background: 'rgba(13,21,38,0.93)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: `0 40px 100px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04), 0 0 60px rgba(232,93,26,0.05)`,
                    height: '460px',
                    overflow: 'hidden',
                    position: 'relative',
                }}>
                    <GlowingEffect spread={60} glow proximity={80} inactiveZone={0.01} borderWidth={2} disabled={false} />
                    <DashboardPreview />
                </div>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [splineReady, setSplineReady] = useState(false);

    const fadeUp = {
        hidden: { opacity: 0, y: 28 },
        visible: (i) => ({
            opacity: 1, y: 0,
            transition: { duration: 0.85, delay: 0.35 + i * 0.13, ease: [0.25, 0.4, 0.25, 1] },
        }),
    };

    const handleLogin = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => navigate('/dashboard'), 1400);
    };

    const inputStyle = {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.09)',
        color: '#ffffff',
        caretColor: '#E85D1A',
    };

    const inputFocus = (e) => {
        e.target.style.background = 'rgba(255,255,255,0.07)';
        e.target.style.borderColor = 'rgba(232,93,26,0.65)';
        e.target.style.boxShadow = '0 0 0 3px rgba(232,93,26,0.10)';
    };

    const inputBlur = (e) => {
        e.target.style.background = 'rgba(255,255,255,0.05)';
        e.target.style.borderColor = 'rgba(255,255,255,0.09)';
        e.target.style.boxShadow = 'none';
    };

    return (
        <div className="min-h-screen w-full overflow-x-hidden" style={{ background: '#030712' }}>

            {/* ── HERO ── */}
            <div className="relative min-h-screen flex items-center overflow-hidden">

                {/* Spline 3D — background layer */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Suspense fallback={
                        <div className="absolute inset-0"
                            style={{ background: 'radial-gradient(ellipse 80% 60% at 60% 50%, rgba(232,93,26,0.07) 0%, transparent 70%)' }} />
                    }>
                        <Spline
                            scene="https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode"
                            onLoad={() => setSplineReady(true)}
                            style={{ width: '100%', height: '100%', opacity: splineReady ? 0.5 : 0, transition: 'opacity 1.2s ease' }}
                        />
                    </Suspense>
                </div>

                {/* Dark overlay */}
                <div className="absolute inset-0 z-[1] pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse 130% 100% at 50% 50%, rgba(3,7,18,0.4) 0%, rgba(3,7,18,0.82) 100%)' }} />

                {/* Floating shapes */}
                <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
                    <ElegantShape delay={0.3} width={560} height={120} rotate={12}
                        gradient="from-orange-500/[0.09]" className="left-[-8%] top-[14%]" />
                    <ElegantShape delay={0.5} width={440} height={100} rotate={-15}
                        gradient="from-blue-500/[0.07]" className="right-[-4%] top-[60%]" />
                    <ElegantShape delay={0.4} width={250} height={68} rotate={-8}
                        gradient="from-violet-500/[0.09]" className="left-[5%] bottom-[10%]" />
                    <ElegantShape delay={0.6} width={180} height={50} rotate={20}
                        gradient="from-amber-500/[0.09]" className="right-[15%] top-[9%]" />
                </div>

                {/* Grid texture */}
                <div className="absolute inset-0 z-[2] pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }} />

                {/* Top/bottom fade */}
                <div className="absolute inset-0 z-[3] pointer-events-none"
                    style={{ background: 'linear-gradient(to bottom, rgba(3,7,18,0.65) 0%, transparent 25%, transparent 75%, rgba(3,7,18,0.9) 100%)' }} />

                {/* Main content */}
                <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20
                        flex flex-col lg:flex-row items-center gap-14">

                    {/* LEFT */}
                    <div className="flex-1 text-center lg:text-left">
                        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                            <Circle className="w-2 h-2 fill-orange-500 text-orange-500" />
                            <span className="text-[11px] text-white/45 tracking-[3px] uppercase">Secure Border Intelligence</span>
                        </motion.div>

                        <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="visible"
                            className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                                One Platform.
                            </span>
                            <br />
                            <span className="bg-clip-text text-transparent"
                                style={{ backgroundImage: 'linear-gradient(90deg,#E85D1A,#FF9A5C,#E85D1A)', backgroundSize: '200%' }}>
                                Every Border.
                            </span>
                        </motion.h1>

                        <motion.p custom={2} variants={fadeUp} initial="hidden" animate="visible"
                            className="text-base leading-relaxed max-w-md mb-10 font-light"
                            style={{ color: 'rgba(255,255,255,0.32)' }}>
                            AI-powered border management. Real-time coordination across all agencies. Zero friction.
                        </motion.p>

                        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible"
                            className="flex flex-wrap items-center gap-5 justify-center lg:justify-start">
                            {['256-bit encrypted', 'Multi-agency sync', 'AI risk scoring'].map((t, i) => (
                                <span key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.22)' }}>
                                    <Shield className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(232,93,26,0.5)' }} />
                                    {t}
                                </span>
                            ))}
                        </motion.div>
                    </div>

                    {/* RIGHT — login card */}
                    <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible"
                        className="w-full max-w-sm flex-shrink-0">

                        {/* GlowingEffect wrapper */}
                        <div className="relative rounded-2xl">
                            <GlowingEffect spread={45} glow proximity={64} inactiveZone={0.01} borderWidth={2} disabled={false} />

                            <div className="relative rounded-2xl p-8"
                                style={{
                                    background: 'rgba(9,14,28,0.80)',
                                    backdropFilter: 'blur(30px)',
                                    WebkitBackdropFilter: 'blur(30px)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 80px rgba(0,0,0,0.65)',
                                }}>

                                {/* Logo */}
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'linear-gradient(135deg,#E85D1A,#FF7A3D)', boxShadow: '0 0 24px rgba(232,93,26,0.5)' }}>
                                        <Shield className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-base leading-none">
                                            <span style={{ color: '#E85D1A' }}>Border</span>Sync
                                        </p>
                                        <p className="text-[10px] tracking-[3px] uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.22)' }}>
                                            Secure Portal
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={handleLogin} className="flex flex-col gap-5">

                                    {/* Email */}
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase tracking-[2px] mb-2"
                                            style={{ color: 'rgba(255,255,255,0.32)' }}>
                                            Email Address
                                        </label>
                                        <input
                                            type="email" value={email} onChange={e => setEmail(e.target.value)}
                                            placeholder="agent@bordersync.gov" required
                                            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
                                            style={inputStyle}
                                            onFocus={inputFocus} onBlur={inputBlur}
                                        />
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase tracking-[2px] mb-2"
                                            style={{ color: 'rgba(255,255,255,0.32)' }}>
                                            Password
                                        </label>
                                        <input
                                            type="password" value={password} onChange={e => setPassword(e.target.value)}
                                            placeholder="••••••••••••" required
                                            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
                                            style={inputStyle}
                                            onFocus={inputFocus} onBlur={inputBlur}
                                        />
                                    </div>

                                    {/* Button */}
                                    <motion.button
                                        type="submit" disabled={isLoading}
                                        whileHover={{ scale: 1.02, boxShadow: '0 8px 40px rgba(232,93,26,0.65)' }}
                                        whileTap={{ scale: 0.975 }}
                                        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-semibold text-white mt-1 disabled:opacity-60"
                                        style={{
                                            background: 'linear-gradient(135deg,#E85D1A,#FF7A3D)',
                                            boxShadow: '0 4px 24px rgba(232,93,26,0.42)',
                                        }}>
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Authenticating...
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="w-4 h-4 flex-shrink-0" />
                                                <span>Secure Login</span>
                                                <ArrowRight className="w-4 h-4 flex-shrink-0 ml-auto" />
                                            </>
                                        )}
                                    </motion.button>
                                </form>

                                {/* Links */}
                                <div className="mt-5 flex justify-between text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                    <span className="hover:text-orange-400 cursor-pointer transition-colors">Forgot password?</span>
                                    <span className="hover:text-orange-400 cursor-pointer transition-colors">Request access</span>
                                </div>

                                {/* Encrypted — INSIDE card, below divider */}
                                <div className="mt-5 pt-5 flex items-center justify-center gap-1.5"
                                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <Lock className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.18)' }} />
                                    <span className="text-[11px] tracking-wide" style={{ color: 'rgba(255,255,255,0.18)' }}>
                                        End-to-end encrypted · MFA enabled
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── SCROLL REVEAL ── */}
            <ScrollReveal />
        </div>
    );
}