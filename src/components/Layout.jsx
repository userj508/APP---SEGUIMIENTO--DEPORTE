import React from 'react';
import { Home, BarChart2, Calendar, User, Apple } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import SikanLogo from './SikanLogo';

const Layout = ({ children }) => {
    const location = useLocation();

    const NavItem = ({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to;
        return (
            <Link to={to} className="flex flex-col items-center justify-center w-full py-2 group">
                <Icon
                    size={24}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={clsx(
                        "mb-1.5 transition-colors",
                        isActive ? "text-sikan-dark" : "text-sikan-muted group-hover:text-sikan-olive"
                    )}
                />
                {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sikan-gold" />
                )}
            </Link>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-sikan-bg text-sikan-dark font-sans">
            <main className="flex-1 overflow-y-auto pb-24">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-sikan-bg/90 backdrop-blur-md border-t border-sikan-border px-6 py-4 flex justify-between items-center z-50 safe-area-bottom shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                <NavItem to="/" icon={Home} label="Home" />
                <NavItem to="/plan" icon={Calendar} label="Plan" />
                <NavItem to="/mealprep" icon={Apple} label="Mealprep" />
                <NavItem to="/dashboard" icon={BarChart2} label="Stats" />
                <NavItem to="/profile" icon={User} label="Profile" />
            </nav>
        </div>
    );
};

export default Layout;
