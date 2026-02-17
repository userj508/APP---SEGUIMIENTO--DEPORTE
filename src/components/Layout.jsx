import React from 'react';
import { Home, BarChart2, Calendar, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

const Layout = ({ children }) => {
    const location = useLocation();

    const NavItem = ({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to;
        return (
            <Link to={to} className="flex flex-col items-center justify-center w-full py-2 group">
                <Icon
                    size={24}
                    className={clsx(
                        "mb-1 transition-colors",
                        isActive ? "text-emerald-500" : "text-slate-500 group-hover:text-slate-400"
                    )}
                />
                <span className={clsx(
                    "text-[10px] font-medium tracking-wide uppercase",
                    isActive ? "text-emerald-500" : "text-slate-500 group-hover:text-slate-400"
                )}>
                    {label}
                </span>
            </Link>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-white font-sans">
            <main className="flex-1 overflow-y-auto pb-20">
                {children}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-6 py-3 flex justify-between items-center z-50 safe-area-bottom">
                <NavItem to="/" icon={Home} label="Home" />
                <NavItem to="/dashboard" icon={BarChart2} label="Stats" />
                <NavItem to="/plan" icon={Calendar} label="Plan" />
                <NavItem to="/profile" icon={User} label="Profile" />
            </nav>
        </div>
    );
};

export default Layout;
