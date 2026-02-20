import React, { useState, useEffect } from 'react';
import { User, LogOut, Award, Calendar, Activity, Settings, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

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
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-slate-500" /></div>;
    }

    const initials = (profile?.full_name || user?.email || 'User').slice(0, 2).toUpperCase();

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-24 font-sans selection:bg-emerald-500/30">
            {/* Minimal Profile Header */}
            <div className="pt-16 pb-10 px-6 max-w-xs mx-auto text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-slate-900 rounded-full mb-5 flex items-center justify-center border-4 border-slate-950 ring-1 ring-white/5 shadow-2xl relative">
                    <span className="text-2xl font-bold tracking-widest text-slate-300">{initials}</span>
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-[3px] border-slate-950 rounded-full"></div>
                </div>
                <h1 className="text-2xl font-bold text-white mb-1.5 tracking-tight">{profile?.full_name || 'Member'}</h1>
                <p className="text-xs text-slate-400 font-medium mb-4">{user?.email}</p>
                <div className="inline-flex items-center justify-center px-3 py-1 bg-slate-900 border border-white/5 rounded-full">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Basic Plan</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="px-5 mb-10">
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-900 border border-white/5 rounded-[20px] p-5 flex flex-col items-center">
                        <div className="text-xl font-bold text-white mb-1 tracking-tight">{stats.totalWorkouts}</div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Workouts</div>
                    </div>
                    <div className="bg-slate-900 border border-white/5 rounded-[20px] p-5 flex flex-col items-center">
                        <div className="text-xl font-bold text-white mb-1 tracking-tight">{stats.streak}</div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Streak</div>
                    </div>
                    <div className="bg-slate-900 border border-white/5 rounded-[20px] p-5 flex flex-col items-center">
                        <div className="text-xl font-bold text-white mb-1 tracking-tight">{stats.activeHours}h</div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Time</div>
                    </div>
                </div>
            </div>

            {/* Menu options list */}
            <div className="px-5 space-y-2.5">
                <SectionItem icon={User} label="Account Details" />
                <SectionItem icon={Award} label="Achievements" />
                <SectionItem icon={Settings} label="Preferences" />

                <button
                    onClick={handleSignOut}
                    className="w-full bg-slate-900 border border-white/5 rounded-[20px] p-4 flex items-center justify-between group hover:bg-rose-500/5 transition-all mt-8 group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-[14px] bg-slate-950 border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-rose-400 transition-colors">
                            <LogOut size={16} />
                        </div>
                        <span className="text-sm font-semibold text-slate-300 group-hover:text-rose-400 transition-colors">Sign Out</span>
                    </div>
                </button>
            </div>

            <div className="mt-12 text-center">
                <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">ANTIGRAVITY v1.0.0</p>
            </div>
        </div>
    );
};

const SectionItem = ({ icon: Icon, label }) => (
    <button className="w-full bg-slate-900 border border-white/5 rounded-[20px] p-4 flex items-center justify-between group hover:bg-slate-800 transition-all">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-[14px] bg-slate-950 border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors shadow-inner">
                <Icon size={16} />
            </div>
            <span className="text-sm font-semibold text-slate-300">{label}</span>
        </div>
        <ChevronRight size={16} className="text-slate-600 group-hover:translate-x-1 group-hover:text-slate-400 transition-all" />
    </button>
);

export default Profile;
