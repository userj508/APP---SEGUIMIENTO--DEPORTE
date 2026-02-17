import React, { useState, useEffect } from 'react';
import { Play, Calendar, Activity, Zap, ChevronRight, Trophy, Flame, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Section from '../components/Section';
import clsx from 'clsx';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Home = () => {
    const { user } = useAuth();
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
                    // First, get ALL workouts to pick one. (Inefficient for large DB, fine for MVP)
                    const { data: workouts } = await supabase
                        .from('workouts')
                        .select('*')
                        .limit(5); // Just grab a few

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
        <div className="min-h-screen bg-slate-950 text-white px-5 pt-8 pb-28">
            {/* Header / Greeting */}
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Welcome back, {headerName}</p>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Let's crush it.</h1>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 opacity-80" />
                </div>
            </header>

            {/* HERO SECTION: Dynamic (Scheduled vs Recommended) */}
            <Section>
                <div className={clsx(
                    "relative overflow-hidden rounded-3xl p-6 border shadow-2xl group transition-all",
                    isRecommendation
                        ? "bg-slate-900 border-slate-800 shadow-purple-900/10" // Recommended Style
                        : "bg-gradient-to-br from-slate-900 to-slate-800 border-emerald-500/30 shadow-emerald-900/20" // Scheduled Style
                )}>
                    {/* Background accents */}
                    <div className={clsx("absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none opacity-20",
                        isRecommendation ? "bg-purple-500" : "bg-emerald-500"
                    )}></div>
                    <div className={clsx("absolute bottom-0 left-0 w-48 h-48 rounded-full blur-2xl -ml-24 -mb-24 pointer-events-none opacity-20",
                        isRecommendation ? "bg-blue-500" : "bg-emerald-500"
                    )}></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            {isRecommendation ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    <Flame size={12} className="mr-1 fill-current" />
                                    Recommended for You
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <CheckCircle2 size={12} className="mr-1" />
                                    Scheduled Today
                                </span>
                            )}
                            <span className="text-slate-400 font-mono text-xs">{activeHero.duration_minutes || activeHero.duration || 45} min</span>
                        </div>

                        <h2 className="text-3xl font-extrabold text-white mb-2 leading-tight">{activeHero.title}</h2>

                        <p className="text-slate-400 text-sm mb-8 max-w-[90%]">
                            {isRecommendation
                                ? `Based on your recovery, we suggest a ${activeHero.reason || 'Quick Session'} session.`
                                : "Ready to hit your target? Let's get this done."}
                        </p>

                        <div className="flex items-center gap-3">
                            <Link to={`/workout/${activeHero.id}`} className={clsx(
                                "flex-1 text-slate-950 font-bold py-4 px-6 rounded-xl flex items-center justify-center transition-all transform active:scale-95 shadow-lg",
                                isRecommendation
                                    ? "bg-purple-500 hover:bg-purple-400 shadow-purple-500/25"
                                    : "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/25"
                            )}>
                                <Play size={20} className="fill-current mr-2" />
                                Start Workout
                            </Link>
                            <button className="bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl border border-slate-700 transition-colors">
                                <Calendar size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </Section>

            {/* QUICK ACTIONS GRID */}
            <Section title="Quick Actions">
                <div className="grid grid-cols-2 gap-4">
                    <Link to="/plan" className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl hover:bg-slate-800 transition-colors flex flex-col items-center justify-center text-center group">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Calendar size={20} />
                        </div>
                        <span className="text-sm font-semibold text-slate-200">Schedule</span>
                    </Link>
                    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl hover:bg-slate-800 transition-colors flex flex-col items-center justify-center text-center group cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Activity size={20} />
                        </div>
                        <span className="text-sm font-semibold text-slate-200">Log Cardio</span>
                    </div>
                </div>
            </Section>

            {/* STATS TEASER */}
            <Section title="Your Progress" action={<Link to="/dashboard" className="text-xs text-emerald-400 font-bold flex items-center">View All <ChevronRight size={14} /></Link>}>
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                            <Trophy size={22} className="fill-current" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">4</div>
                            <div className="text-xs text-slate-400 font-medium">Workouts this week</div>
                        </div>
                    </div>

                    {/* Simple graph visualization placeholder */}
                    <div className="h-10 flex items-end gap-1">
                        <div className="w-1 bg-slate-700/50 h-[40%] rounded-t-sm"></div>
                        <div className="w-1 bg-slate-700/50 h-[60%] rounded-t-sm"></div>
                        <div className="w-1 bg-emerald-500 h-[100%] rounded-t-sm shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <div className="w-1 bg-slate-700/50 h-[30%] rounded-t-sm"></div>
                        <div className="w-1 bg-slate-700/50 h-[0%] rounded-t-sm"></div>
                    </div>
                </div>
            </Section>

            {/* RECOVERY CARD */}
            <Section>
                <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Zap size={16} className="text-indigo-400 fill-current" />
                            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">Recovery</span>
                        </div>
                        <h4 className="text-lg font-bold text-white">Scale it back?</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-[180px]">Your HRV is lower than usual. Maybe try a flow session.</p>
                    </div>
                    <div className="h-14 w-14 rounded-full border-4 border-slate-800 flex items-center justify-center relative">
                        <svg className="absolute w-full h-full -rotate-90">
                            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="150" strokeDashoffset="40" className="text-indigo-500" />
                        </svg>
                        <span className="text-xs font-bold">72%</span>
                    </div>
                </div>
            </Section>
        </div>
    );
};

export default Home;
