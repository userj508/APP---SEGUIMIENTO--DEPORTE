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
        activeMinutes: 0
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

                // Fetch Stats (Mock calculation for consistency/streak for now, real total count)
                const { count, error } = await supabase
                    .from('workout_logs')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('status', 'completed');

                setStats({
                    totalWorkouts: count || 0,
                    streak: 3, // Mock for MVP
                    activeMinutes: (count || 0) * 45 // Estimate
                });

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
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;
    }

    const initials = (profile?.full_name || user?.email || 'User').slice(0, 2).toUpperCase();

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-24">
            {/* Header */}
            <div className="bg-gradient-to-b from-emerald-900/20 to-slate-950 pt-12 pb-8 px-6 text-center">
                <div className="w-24 h-24 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-slate-900 shadow-xl">
                    <span className="text-3xl font-bold text-slate-400">{initials}</span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">{profile?.full_name || 'Member'}</h1>
                <p className="text-sm text-slate-500 font-mono">{user?.email}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase rounded-md border border-emerald-500/20">Pro Member</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="px-5 mb-8">
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2 text-emerald-500">
                            <Activity size={16} />
                        </div>
                        <div className="text-xl font-bold text-white mb-0.5">{stats.totalWorkouts}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">Workouts</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
                        <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-2 text-orange-500">
                            <Award size={16} />
                        </div>
                        <div className="text-xl font-bold text-white mb-0.5">{stats.streak}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">Day Streak</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2 text-blue-500">
                            <Calendar size={16} />
                        </div>
                        <div className="text-xl font-bold text-white mb-0.5">{Math.round(stats.activeMinutes / 60)}h</div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">Active Time</div>
                    </div>
                </div>
            </div>

            {/* Menu */}
            <div className="px-5 space-y-3">
                <SectionItem icon={User} label="Account Details" />
                <SectionItem icon={Settings} label="App Settings" />
                <SectionItem icon={Award} label="Achievements" />

                <button
                    onClick={handleSignOut}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between group hover:border-slate-700 transition-all mt-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center group-hover:bg-rose-500/10 group-hover:text-rose-500 transition-colors text-slate-500">
                            <LogOut size={20} />
                        </div>
                        <span className="font-bold text-slate-300 group-hover:text-white">Sign Out</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="mt-12 text-center">
                <p className="text-[10px] text-slate-700 font-mono">ANTIGRAVITY v0.9.2 (Beta)</p>
            </div>
        </div>
    );
};

const SectionItem = ({ icon: Icon, label }) => (
    <button className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between group hover:border-slate-700 transition-all">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-white transition-colors">
                <Icon size={20} />
            </div>
            <span className="font-bold text-slate-300 group-hover:text-white">{label}</span>
        </div>
        <ChevronRight size={16} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
    </button>
);

export default Profile;
