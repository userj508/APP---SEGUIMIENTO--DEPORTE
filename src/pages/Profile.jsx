import React, { useState, useEffect } from 'react';
import { User, LogOut, Award, Calendar, Activity, Settings, ChevronRight, Loader2, Zap, HeartPulse, Flame, RefreshCcw, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { syncStravaActivities } from '../lib/strava';
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
    const [isSyncingStrava, setIsSyncingStrava] = useState(false);
    const [showStravaTokens, setShowStravaTokens] = useState(false);
    const [stravaTokensForm, setStravaTokensForm] = useState({ access: '', refresh: '' });

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

    const handleStravaSync = async () => {
        if (!profile?.strava_access_token) {
            setShowStravaTokens(true);
            return;
        }

        setIsSyncingStrava(true);
        try {
            const count = await syncStravaActivities(user.id, profile.strava_access_token, profile.strava_refresh_token);
            alert(`Sincronización completada. ${count} actividades importadas.`);
            // Refresh stats by just remounting profile logic (we could trigger a reload)
            window.location.reload();
        } catch (error) {
            console.error("Strava Sync Error");
            alert("Error al sincronizar Strava. Comprueba tus conectores.");
        } finally {
            setIsSyncingStrava(false);
        }
    };

    const handleSaveStravaTokens = async () => {
        try {
            await supabase.from('profiles').update({
                strava_access_token: stravaTokensForm.access,
                strava_refresh_token: stravaTokensForm.refresh
            }).eq('id', user.id);
            setProfile(p => ({ ...p, strava_access_token: stravaTokensForm.access, strava_refresh_token: stravaTokensForm.refresh }));
            setShowStravaTokens(false);
            alert("Tokens guardados. Ahora puedes sincronizar.");
        } catch (e) {
            console.error("Error saving tokens");
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>;
    }

    const initials = (profile?.full_name || user?.email || 'User').slice(0, 2).toUpperCase();

    return (
        <div className="min-h-screen bg-sikan-bg text-sikan-dark pb-28 font-sans selection:bg-sikan-gold/30 overflow-x-hidden relative">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[300px] bg-sikan-gold/10 blur-[120px] rounded-[100%] pointer-events-none"></div>

            {/* Profile Header */}
            <div className="pt-20 pb-10 px-6 max-w-sm mx-auto text-center flex flex-col items-center relative z-10">
                <div className="relative mb-6 group cursor-pointer">
                    <div className="absolute inset-0 bg-sikan-gold blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full"></div>
                    <div className="w-28 h-28 bg-[#EAE4DC] rounded-[28px] rotate-3 group-hover:rotate-6 transition-transform duration-500 flex items-center justify-center border border-sikan-border shadow-xl relative">
                        <div className="absolute inset-0 bg-sikan-card rounded-[28px] -rotate-3 group-hover:-rotate-6 transition-transform duration-500 border border-sikan-border flex items-center justify-center overflow-hidden">
                            <span className="text-3xl font-serif tracking-widest text-sikan-olive">{initials}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 mb-2">
                    <h1 className="text-3xl font-serif font-bold text-sikan-dark tracking-tight">{profile?.full_name || 'Member'}</h1>
                </div>
                <p className="text-sm font-sans tracking-wide text-sikan-muted font-medium mb-5">{user?.email}</p>

                <div className="inline-flex items-center justify-center px-4 py-1.5 bg-sikan-gold/10 border border-sikan-gold/20 rounded-full shadow-[0_0_20px_rgba(192,160,107,0.1)]">
                    <Zap size={14} className="text-[#A47146] mr-1.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#A47146]">Pro Member</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="px-5 mb-10 relative z-10">
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-sikan-card border border-sikan-border rounded-xl p-5 flex flex-col items-center justify-center hover:bg-white transition-colors shadow-sm">
                        <Activity size={18} className="text-sikan-olive mb-2" />
                        <div className="text-2xl font-bold font-serif text-sikan-dark tracking-tighter">{stats.totalWorkouts}</div>
                        <div className="text-[9px] uppercase font-bold tracking-widest text-sikan-muted mt-1">Sessions</div>
                    </div>
                    <div className="bg-sikan-olive border border-sikan-olive/80 rounded-xl p-5 flex flex-col items-center justify-center transform scale-105 shadow-lg shadow-sikan-olive/20 z-10">
                        <Flame size={20} className="text-sikan-gold-light mb-2" />
                        <div className="text-3xl font-bold font-serif text-sikan-bg tracking-tighter">{stats.streak}</div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-sikan-gold-light mt-1">Day Streak</div>
                    </div>
                    <div className="bg-sikan-card border border-sikan-border rounded-xl p-5 flex flex-col items-center justify-center hover:bg-white transition-colors shadow-sm">
                        <HeartPulse size={18} className="text-rose-400 mb-2" />
                        <div className="text-2xl font-bold font-serif text-sikan-dark tracking-tighter">{stats.activeHours}h</div>
                        <div className="text-[9px] uppercase font-bold tracking-widest text-sikan-muted mt-1">Active Time</div>
                    </div>
                </div>
            </div>

            {/* Simulated Activity Heatmap */}
            <div className="px-5 mb-10 relative z-10">
                <div className="bg-sikan-card rounded-xl border border-sikan-border p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[11px] font-bold text-sikan-dark uppercase tracking-widest">Recent Activity</h3>
                        <span className="text-[10px] text-sikan-olive font-bold bg-sikan-olive/10 px-2 py-0.5 rounded">Last 28 Days</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5 max-w-full justify-items-center">
                        {heatmapData.map((level, i) => (
                            <div
                                key={i}
                                className={clsx(
                                    "w-full aspect-square rounded-[6px] transition-colors duration-300",
                                    level === 0 ? "bg-sikan-border/50" :
                                        level === 1 ? "bg-sikan-olive/30" :
                                            level === 2 ? "bg-sikan-olive/60" :
                                                "bg-sikan-olive/90 shadow-sm"
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

                {/* Strava Component */}
                <button
                    onClick={handleStravaSync}
                    disabled={isSyncingStrava}
                    className="w-full bg-[#FC5200]/10 border border-[#FC5200]/20 rounded-xl p-4 flex items-center justify-between group hover:border-[#FC5200]/40 hover:bg-[#FC5200]/20 transition-all shadow-sm"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[#FC5200] flex items-center justify-center text-white shadow-md relative overflow-hidden group-hover:scale-105 transition-transform">
                            {isSyncingStrava ? <Loader2 size={24} className="animate-spin relative z-10" /> : <RefreshCcw size={24} className="relative z-10" />}
                        </div>
                        <div className="flex flex-col items-start gap-1">
                            <span className="text-sm font-bold text-sikan-dark">{profile?.strava_access_token ? "Sync Strava" : "Connect Strava"}</span>
                            <span className="text-[10px] font-bold text-sikan-muted uppercase tracking-widest">{profile?.strava_access_token ? "Pull latest activities" : "Add your tokens"}</span>
                        </div>
                    </div>
                </button>

                {showStravaTokens && (
                    <div className="bg-sikan-card border border-sikan-border rounded-xl p-5 shadow-inner animate-in slide-in-from-top-2 duration-300">
                        <h4 className="text-xs font-bold text-sikan-dark uppercase tracking-widest mb-3">Vincular Tokens Strava</h4>
                        <input
                            type="text"
                            placeholder="Access Token"
                            value={stravaTokensForm.access}
                            onChange={(e) => setStravaTokensForm({ ...stravaTokensForm, access: e.target.value })}
                            className="w-full mb-2 bg-sikan-bg border border-sikan-border rounded-lg py-2 px-3 text-xs focus:border-sikan-olive outline-none text-sikan-dark font-mono"
                        />
                        <input
                            type="text"
                            placeholder="Refresh Token"
                            value={stravaTokensForm.refresh}
                            onChange={(e) => setStravaTokensForm({ ...stravaTokensForm, refresh: e.target.value })}
                            className="w-full mb-3 bg-sikan-bg border border-sikan-border rounded-lg py-2 px-3 text-xs focus:border-sikan-olive outline-none text-sikan-dark font-mono"
                        />
                        <button onClick={handleSaveStravaTokens} className="bg-sikan-olive hover:bg-[#8A9A5B] text-sikan-bg w-full py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm">
                            <Save size={14} /> Guardar Tokens
                        </button>
                    </div>
                )}

                <button
                    onClick={handleSignOut}
                    className="w-full bg-sikan-card border border-sikan-border rounded-xl p-4 flex items-center justify-between group hover:border-rose-500/20 hover:bg-rose-50/50 transition-all mt-8"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-sikan-bg border border-sikan-border flex items-center justify-center text-sikan-muted group-hover:text-rose-400 transition-colors">
                            <LogOut size={18} />
                        </div>
                        <span className="text-sm font-semibold text-sikan-dark group-hover:text-rose-500 transition-colors">Sign Out</span>
                    </div>
                </button>
            </div>

            <div className="mt-12 text-center pb-8 relative z-10">
                <div className="inline-flex flex-col items-center">
                    <div className="w-8 h-1 bg-sikan-gold rounded-full mb-3"></div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-sikan-muted font-bold">SIKAN v2.0</p>
                </div>
            </div>
        </div>
    );
};

const SectionItem = ({ icon: Icon, label, badge }) => (
    <button className="w-full bg-sikan-card border border-sikan-border rounded-xl p-4 flex items-center justify-between group hover:shadow-md transition-all">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#EAE4DC] border border-sikan-border flex items-center justify-center text-sikan-olive group-hover:bg-sikan-olive group-hover:text-sikan-bg transition-colors relative overflow-hidden">
                <Icon size={20} className="relative z-10" />
            </div>
            <span className="text-sm font-semibold text-sikan-dark transition-colors">{label}</span>
        </div>
        <div className="flex items-center gap-3">
            {badge && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#A47146] bg-[#E3C7A1] px-2 py-1 rounded-full">{badge}</span>
            )}
            <ChevronRight size={18} className="text-sikan-muted group-hover:translate-x-1 group-hover:text-sikan-olive transition-all" />
        </div>
    </button>
);

export default Profile;
