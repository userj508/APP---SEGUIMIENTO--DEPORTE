import React, { useState, useEffect } from 'react';
import { User, LogOut, Award, Calendar, Activity, Settings, ChevronRight, Loader2, Zap, HeartPulse, Flame } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

const Profile = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalWorkouts: 0,
        streak: 0,
        activeHours: 0
    });
    const [profile, setProfile] = useState(null);

    // Mock Heatmap Data
    const generateHeatmap = () => {
        return Array.from({ length: 28 }).map(() => Math.floor(Math.random() * 4));
    };
    const [heatmapData] = useState(generateHeatmap());

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                // Fetch Profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();
                setProfile(profileData);

                // Fetch Stats natively
                const { data: logs, error } = await supabase
                    .from('workout_logs')
                    .select('started_at, completed_at')
                    .eq('user_id', user.id)
                    .eq('status', 'completed');

                if (logs) {
                    // Duration
                    let totalMin = 0;
                    logs.forEach(log => {
                        if (log.started_at && log.completed_at) {
                            const start = new Date(log.started_at);
                            const end = new Date(log.completed_at);
                            const diffMins = Math.floor((end - start) / (1000 * 60));
                            if (diffMins > 0 && diffMins < 600) {
                                totalMin += diffMins;
                            }
                        }
                    });

                    // Streak
                    let streak = 0;
                    let currentDate = new Date();
                    currentDate.setHours(0, 0, 0, 0);

                    const activeDates = new Set(logs.map(log => {
                        const d = new Date(log.completed_at);
                        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                    }));

                    for (let i = 0; i < 365; i++) {
                        const checkDate = new Date(currentDate);
                        checkDate.setDate(currentDate.getDate() - i);
                        const dateStr = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
                        if (activeDates.has(dateStr)) {
                            streak++;
                        } else if (i === 0) {
                            continue;
                        } else {
                            break;
                        }
                    }

                    setStats({
                        totalWorkouts: logs.length,
                        streak: streak,
                        activeHours: Math.round(totalMin / 60)
                    });
                }

            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>;
    }

    const initials = (profile?.full_name || user?.email || 'User').slice(0, 2).toUpperCase();

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-28 font-sans selection:bg-emerald-500/30 overflow-x-hidden relative">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[300px] bg-emerald-500/10 blur-[120px] rounded-[100%] pointer-events-none"></div>

            {/* Profile Header */}
            <div className="pt-20 pb-10 px-6 max-w-sm mx-auto text-center flex flex-col items-center relative z-10">
                <div className="relative mb-6 group cursor-pointer">
                    <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full"></div>
                    <div className="w-28 h-28 bg-gradient-to-br from-slate-800 to-slate-950 rounded-[28px] rotate-3 group-hover:rotate-6 transition-transform duration-500 flex items-center justify-center border border-white/10 shadow-2xl relative">
                        <div className="absolute inset-0 bg-slate-900 rounded-[28px] -rotate-3 group-hover:-rotate-6 transition-transform duration-500 border border-white/5 flex items-center justify-center overflow-hidden">
                            <span className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">{initials}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold text-white tracking-tight">{profile?.full_name || 'Member'}</h1>
                </div>
                <p className="text-sm text-slate-400 font-medium mb-5">{user?.email}</p>

                <div className="inline-flex items-center justify-center px-4 py-1.5 bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                    <Zap size={14} className="text-emerald-400 mr-1.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Pro Member</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="px-5 mb-10 relative z-10">
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-900/80 backdrop-blur-md border border-white/5 rounded-[24px] p-5 flex flex-col items-center justify-center hover:bg-slate-800/80 transition-colors shadow-xl">
                        <Activity size={18} className="text-emerald-400 mb-2" />
                        <div className="text-2xl font-black text-white tracking-tighter">{stats.totalWorkouts}</div>
                        <div className="text-[9px] uppercase font-bold tracking-widest text-slate-500 mt-1">Sessions</div>
                    </div>
                    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/20 rounded-[24px] p-5 flex flex-col items-center justify-center ring-1 ring-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.05)] transform scale-105 z-10">
                        <Flame size={20} className="text-orange-500 mb-2" />
                        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 tracking-tighter">{stats.streak}</div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-500 mt-1">Day Streak</div>
                    </div>
                    <div className="bg-slate-900/80 backdrop-blur-md border border-white/5 rounded-[24px] p-5 flex flex-col items-center justify-center hover:bg-slate-800/80 transition-colors shadow-xl">
                        <HeartPulse size={18} className="text-rose-400 mb-2" />
                        <div className="text-2xl font-black text-white tracking-tighter">{stats.activeHours}h</div>
                        <div className="text-[9px] uppercase font-bold tracking-widest text-slate-500 mt-1">Active Time</div>
                    </div>
                </div>
            </div>

            {/* Simulated Activity Heatmap */}
            <div className="px-5 mb-10 relative z-10">
                <div className="bg-slate-900 rounded-[24px] border border-white/5 p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Recent Activity</h3>
                        <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Last 28 Days</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5 max-w-full justify-items-center">
                        {heatmapData.map((level, i) => (
                            <div
                                key={i}
                                className={clsx(
                                    "w-full aspect-square rounded-[6px] transition-colors duration-300",
                                    level === 0 ? "bg-slate-800" :
                                        level === 1 ? "bg-emerald-500/40" :
                                            level === 2 ? "bg-emerald-500/70" :
                                                "bg-emerald-400 ring-1 ring-emerald-400/50 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Menu options list */}
            <div className="px-5 space-y-3 relative z-10">
                <SectionItem icon={User} label="Account Details" />
                <SectionItem icon={Award} label="Achievements & Badges" badge="3 New" />
                <SectionItem icon={Settings} label="App Preferences" />

                <button
                    onClick={handleSignOut}
                    className="w-full bg-slate-900/50 border border-white/5 rounded-[24px] p-4 flex items-center justify-between group hover:bg-rose-500/10 hover:border-rose-500/20 transition-all mt-8"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-[14px] bg-slate-950 border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-rose-400 group-hover:bg-rose-500/10 transition-colors">
                            <LogOut size={18} />
                        </div>
                        <span className="text-sm font-bold text-slate-400 group-hover:text-rose-400 transition-colors">Sign Out</span>
                    </div>
                </button>
            </div>

            <div className="mt-12 text-center pb-8 relative z-10">
                <div className="inline-flex flex-col items-center">
                    <div className="w-8 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full mb-3"></div>
                    <p className="text-[9px] uppercase tracking-widest text-slate-600 font-black">ANTIGRAVITY OS v1.0.0</p>
                </div>
            </div>
        </div>
    );
};

const SectionItem = ({ icon: Icon, label, badge }) => (
    <button className="w-full bg-slate-900 border border-white/5 rounded-[24px] p-4 flex items-center justify-between group hover:bg-slate-800 transition-all hover:border-white/10 shadow-lg shadow-black/20">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[16px] bg-gradient-to-b from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition-colors shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Icon size={20} className="relative z-10" />
            </div>
            <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{label}</span>
        </div>
        <div className="flex items-center gap-3">
            {badge && (
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-950 bg-emerald-500 px-2 py-1 rounded-full">{badge}</span>
            )}
            <ChevronRight size={18} className="text-slate-600 group-hover:translate-x-1 group-hover:text-emerald-400 transition-all" />
        </div>
    </button>
);

export default Profile;
