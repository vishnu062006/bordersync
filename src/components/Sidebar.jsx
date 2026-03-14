import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
    {
        path: '/dashboard',
        label: 'Dashboard',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        path: '/new-entry',
        label: 'New Entry',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
        ),
    },
    {
        path: '/alerts',
        label: 'Alerts',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        ),
        badge: 3,
    },
];

export default function Sidebar() {
    const navigate = useNavigate();
    const { signOut } = useAuth();

    return (
        <aside
            className="fixed top-0 left-0 h-screen flex flex-col z-50"
            style={{
                width: '220px',
                background: 'linear-gradient(180deg, #0D1526 0%, #0A0F1E 100%)',
                borderRight: '1px solid rgba(232, 93, 26, 0.1)',
                boxShadow: '1px 0 20px rgba(232, 93, 26, 0.05)',
            }}
        >
            {/* Logo */}
            <div className="px-5 pt-6 pb-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black"
                        style={{
                            background: 'linear-gradient(135deg, #E85D1A, #FF7A3D)',
                            boxShadow: '0 0 20px rgba(232, 93, 26, 0.35)',
                        }}
                    >
                        <span className="text-white">B</span>
                    </div>
                    <div>
                        <h1
                            className="text-base font-bold text-white tracking-tight leading-none"
                            style={{ textShadow: '0 0 30px rgba(232, 93, 26, 0.15)' }}
                        >
                            <span style={{ color: '#E85D1A', textShadow: '0 0 20px rgba(232, 93, 26, 0.4)' }}>B</span>
                            order<span style={{ color: '#E85D1A', textShadow: '0 0 20px rgba(232, 93, 26, 0.4)' }}>Sync</span>
                        </h1>
                        <p className="text-[9px] text-gray-600 font-medium uppercase tracking-[0.15em] mt-0.5">
                            v2.4 · Secure
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-5 px-3 overflow-y-auto">
                <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-[0.2em] px-3 mb-3">
                    Operations
                </p>
                <ul className="space-y-1">
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 group relative ${isActive
                                        ? 'text-accent bg-accent/8'
                                        : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03]'
                                    }`
                                }
                                style={({ isActive }) =>
                                    isActive
                                        ? {
                                            borderLeft: '3px solid #E85D1A',
                                            background: 'rgba(232, 93, 26, 0.06)',
                                        }
                                        : { borderLeft: '3px solid transparent' }
                                }
                            >
                                <span className="flex-shrink-0">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                                {item.badge && (
                                    <span
                                        className="ml-auto w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold"
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.15)',
                                            color: '#EF4444',
                                        }}
                                    >
                                        {item.badge}
                                    </span>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* User Section */}
            <div className="px-4 py-4 border-t border-white/5">
                <div className="flex items-center gap-3 mb-3">
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{
                            background: 'linear-gradient(135deg, #1E293B, #334155)',
                            border: '2px solid rgba(232, 93, 26, 0.25)',
                        }}
                    >
                        JD
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">John Doe</p>
                        <p className="text-[10px] text-gray-600 truncate">Senior Agent</p>
                    </div>
                </div>
                <button
                    onClick={async () => {
                        await signOut();
                        navigate('/');
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/15 transition-all duration-300"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                </button>
            </div>

            {/* System Status */}
            <div className="px-4 pb-4">
                <div
                    className="rounded-lg px-3 py-2.5 flex items-center gap-2.5"
                    style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                >
                    <span className="pulse-dot-green" />
                    <div>
                        <p className="text-[11px] text-green-400 font-medium leading-none">System Online</p>
                        <p className="text-[9px] text-gray-600 mt-0.5">Last sync: 2 min ago</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
