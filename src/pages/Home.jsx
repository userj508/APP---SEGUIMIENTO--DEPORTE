import React, { useState, useEffect } from 'react';
import { Play, Calendar, Activity, Zap, ChevronRight, Trophy, Flame, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Section from '../components/Section';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [headerName, setHeaderName] = useState('Athlete');
    const [featuredWorkout, setFeaturedWorkout] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Get Profile Name
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profile?.full_name) {
                    setHeaderName(profile.full_name.split(' ')[0]);
                } else if (user.email) {
                    setHeaderName(user.email.split('@')[0]);
                }

                // 2. Check for Scheduled Workout TODAY
                const today = new Date().toISOString().split('T')[0];
                const { data: schedule } = await supabase
                    .from('schedule')
                    .select('*, workouts(*)')
                    .eq('user_id', user.id)
                    .eq('scheduled_date', today)
                    .maybeSingle();

                if (schedule?.workouts) {
                    setFeaturedWorkout({
                        ...schedule.workouts,
                        isScheduled: true
                    });
                } else {
                    // 3. Fallback: Get a random "Recommended" workout
                    const { data: workouts } = await supabase
                        .from('workouts')
                        .select('*')
                        .limit(5);

                    if (workouts && workouts.length > 0) {
                        const random = workouts[Math.floor(Math.random() * workouts.length)];
                        setFeaturedWorkout({
                            ...random,
                            isScheduled: false,
                            reason: "Suggested for You"
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching home data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Fallback if DB is empty and no workout found
    const defaultWorkout = {
        id: 'mock-1',
        title: "Intro Strength",
        duration_minutes: 30,
        type: "Strength",
        reason: "Get Started",
        isScheduled: false
    };

    const activeHero = featuredWorkout || defaultWorkout;
    const isRecommendation = !activeHero.isScheduled;

    return (
        <div className="min-h-screen bg-slate-950 text-white px-5 pt-10 pb-28 font-sans selection:bg-emerald-500/30">
            {/* Header / Greeting */}
            <header className="mb-10 flex justify-between items-center">
                <div>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1.5">Welcome back</p>
                    <h1 className="text-3xl font-bold tracking-tight text-white">{headerName}</h1>
                </div>
                <div className="w-11 h-11 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center shadow-lg shadow-black/50 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-slate-300 font-bold text-sm">
                        {headerName.charAt(0).toUpperCase()}
                    </div>
                </div>
            </header>

            {/* HERO SECTION */}
            <Section>
                <div className="relative overflow-hidden rounded-[24px] bg-slate-900 border border-white/5 shadow-2xl p-6 transition-all">
                    {/* Subtle aesthetic gradient */}
                    <div className={clsx(
                        "absolute top-0 right-0 w-full h-full opacity-[0.03] pointer-events-none bg-gradient-to-br",
                        isRecommendation ? "from-purple-500 to-transparent" : "from-emerald-500 to-transparent"
                    )} />

                    <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                        <div className="flex justify-between items-start">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-slate-950/50 backdrop-blur-sm border border-white/5">
                                {isRecommendation ? (
                                    <><Flame size={12} className="text-slate-400" /><span className="text-slate-300">Recommended</span></>
                                ) : (
                                    <><CheckCircle2 size={12} className="text-emerald-500" /><span className="text-slate-300">Scheduled Today</span></>
                                )}
                            </div>
                            <span className="text-slate-400 font-mono text-xs font-medium px-2 py-1">{activeHero.duration_minutes || activeHero.duration || 45} min</span>
                        </div>

                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight tracking-tight">{activeHero.title}</h2>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[85%]">
                                {isRecommendation
                                    ? `Based on your recovery, we suggest a ${activeHero.reason?.toLowerCase() || 'quick session'}.`
                                    : "Ready to hit your target? Let's get this done."}
                            </p>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={() => navigate(`/workout/${activeHero.id}`)}
                                className={clsx(
                                    "flex-1 font-semibold text-sm py-4 px-6 rounded-2xl flex items-center justify-center transition-all transform active:scale-[0.98]",
                                    isRecommendation
                                        ? "bg-slate-100 text-slate-950 hover:bg-white"
                                        : "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                                )}>
                                Start Workout
                            </button>
                            <button
                                onClick={() => navigate('/plan')}
                                className="bg-slate-950 hover:bg-slate-800 text-slate-300 p-4 rounded-2xl border border-white/5 transition-colors flex items-center justify-center">
                                <Calendar size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </Section>

            {/* QUICK ACTIONS GRID */}
            <Section title="Quick Actions">
                <div className="grid grid-cols-2 gap-3">
                    <Link to="/plan" className="bg-slate-900 border border-white/5 p-5 rounded-[20px] hover:bg-slate-800/80 transition-colors flex flex-col items-start group">
                        <div className="w-10 h-10 rounded-full bg-slate-950 border border-white/5 text-slate-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Calendar size={18} />
                        </div>
                        <span className="text-sm font-semibold text-slate-200">Plan Week</span>
                    </Link>
                    <div className="bg-slate-900 border border-white/5 p-5 rounded-[20px] hover:bg-slate-800/80 transition-colors flex flex-col items-start group cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-slate-950 border border-white/5 text-slate-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Activity size={18} />
                        </div>
                        <span className="text-sm font-semibold text-slate-200">Log Activity</span>
                    </div>
                </div>
            </Section>

            {/* STATS TEASER */}
            <Section title="Your Progress" action={<Link to="/dashboard" className="text-xs text-slate-400 hover:text-white font-semibold transition-colors flex items-center">View Dashboard <ChevronRight size={14} className="ml-1" /></Link>}>
                <div className="bg-slate-900 rounded-[24px] p-6 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-white/5 text-slate-300 flex items-center justify-center">
                            <Trophy size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white tracking-tight">4</div>
                            <div className="text-xs text-slate-400 font-medium mt-0.5">Sessions this week</div>
                        </div>
                    </div>

                    {/* Minimalist Bar Graph */}
                    <div className="flex items-end gap-1.5 h-10">
                        <div className="w-1.5 bg-slate-800 h-[40%] rounded-full"></div>
                        <div className="w-1.5 bg-slate-800 h-[60%] rounded-full"></div>
                        <div className="w-1.5 bg-emerald-500 h-[100%] rounded-full"></div>
                        <div className="w-1.5 bg-slate-800 h-[30%] rounded-full"></div>
                        <div className="w-1.5 bg-slate-800 h-[20%] rounded-full"></div>
                    </div>
                </div>
            </Section>

            {/* RECOVERY CARD */}
            <Section>
                <div className="bg-slate-900 border border-white/5 rounded-[24px] p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-950 border border-white/5 flex items-center justify-center">
                            <Zap size={12} className="text-slate-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Readiness Profile</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <h4 className="text-xl font-bold text-white tracking-tight leading-snug">Optimal Recovery</h4>
                            <p className="text-sm text-slate-400 mt-1 max-w-[200px]">Your nervous system is primed for high intensity.</p>
                        </div>
                        <div className="text-3xl font-light tracking-tighter text-emerald-400">
                            92<span className="text-lg opacity-50">%</span>
                        </div>
                    </div>
                </div>
            </Section>
        </div>
    );
};

export default Home;
