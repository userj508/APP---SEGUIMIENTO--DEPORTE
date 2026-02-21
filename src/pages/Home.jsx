import React, { useState, useEffect } from 'react';
import { Play, Calendar, Activity, Zap, ChevronRight, Trophy, CheckCircle2, Moon, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Section from '../components/Section';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import CreateWorkoutModal from '../components/CreateWorkoutModal';
import DayScheduleModal from '../components/DayScheduleModal';

const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [headerName, setHeaderName] = useState('Athlete');

    const [scheduledWorkout, setScheduledWorkout] = useState(null);
    const [scheduledExercises, setScheduledExercises] = useState([]);
    const [weekSchedule, setWeekSchedule] = useState([]);
    const [weekDates, setWeekDates] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedDaySchedule, setSelectedDaySchedule] = useState(null);

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
                    setScheduledWorkout(schedule.workouts);

                    // Fetch preview exercises for this workout
                    const { data: exercises } = await supabase
                        .from('workout_exercises')
                        .select('exercises(name)')
                        .eq('workout_id', schedule.workouts.id)
                        .order('order_index')
                        .limit(4); // Just grab first 4 for preview

                    if (exercises) {
                        setScheduledExercises(exercises.map(e => e.exercises.name));
                    }
                } else {
                    // Deliberately empty - no fallback
                    setScheduledWorkout(null);
                    setScheduledExercises([]);
                }

                // 3. Fetch Weekly Schedule
                const startOfWeek = new Date();
                const day = startOfWeek.getDay() || 7;
                if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
                else startOfWeek.setHours(0, 0, 0, 0);

                const dates = [];
                for (let i = 0; i < 7; i++) {
                    const d = new Date(startOfWeek);
                    d.setDate(startOfWeek.getDate() + i);
                    dates.push(d);
                }
                const startDateStr = dates[0].toISOString().split('T')[0];
                const endDateStr = dates[6].toISOString().split('T')[0];

                const { data: weekData } = await supabase
                    .from('schedule')
                    .select('*, workouts(*)')
                    .eq('user_id', user.id)
                    .gte('scheduled_date', startDateStr)
                    .lte('scheduled_date', endDateStr);

                setWeekSchedule(weekData || []);
                setWeekDates(dates);

            } catch (error) {
                console.error("Error fetching home data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleWorkoutCreated = (newWorkout) => {
        // Automatically route to Plan to schedule the new workout, or we could auto-schedule it for today.
        // For now, let's keep it simple and route to Plan.
        navigate('/plan');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white px-5 pt-10 pb-28 font-sans selection:bg-emerald-500/30 relative">
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

            {/* HERO SECTION - DYNAMIC */}
            <Section>
                <div className={clsx(
                    "relative overflow-hidden rounded-[24px] border shadow-2xl p-6 transition-all",
                    scheduledWorkout
                        ? "bg-slate-900 border-white/5"
                        : "bg-slate-950 border-white/5 border-dashed" // Empty State Styling
                )}>
                    {scheduledWorkout && (
                        <div className="absolute top-0 right-0 w-full h-full opacity-[0.03] pointer-events-none bg-gradient-to-br from-emerald-500 to-transparent" />
                    )}

                    <div className="relative z-10 flex flex-col h-full justify-between gap-6">

                        {/* Header Chip */}
                        <div className="flex justify-between items-start">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-slate-950/50 backdrop-blur-sm border border-white/5">
                                {scheduledWorkout ? (
                                    <><CheckCircle2 size={12} className="text-emerald-500" /><span className="text-slate-300">Scheduled Today</span></>
                                ) : (
                                    <><Moon size={12} className="text-slate-500" /><span className="text-slate-400">Rest Day</span></>
                                )}
                            </div>

                            {scheduledWorkout && (
                                <span className="text-slate-400 font-mono text-xs font-medium px-2 py-1">
                                    {scheduledWorkout.duration_minutes || 45} min
                                </span>
                            )}
                        </div>

                        {/* Title & Description / Preview */}
                        <div>
                            {scheduledWorkout ? (
                                <>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight tracking-tight">
                                        {scheduledWorkout.title}
                                    </h2>

                                    {/* EXERCISE PREVIEW CHIPS */}
                                    {scheduledExercises.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {scheduledExercises.map((ex, i) => (
                                                <span key={i} className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                                                    {ex}
                                                </span>
                                            ))}
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-950 border border-white/5 px-2.5 py-1 rounded-md">
                                                ...
                                            </span>
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[85%]">
                                            Ready to hit your target? Let's get this done.
                                        </p>
                                    )}
                                </>
                            ) : (
                                // EMPTY STATE TEXT
                                <>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight tracking-tight">
                                        No Session Planned
                                    </h2>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[90%]">
                                        Enjoy your rest, pick a routine from your library, or build a new one.
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="pt-2">
                            {scheduledWorkout ? (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => navigate(`/workout/${scheduledWorkout.id}`)}
                                        className="flex-1 font-semibold text-sm py-4 px-6 rounded-2xl flex items-center justify-center transition-all transform active:scale-[0.98] bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                                    >
                                        Start Session
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <button
                                        onClick={() => navigate('/plan')}
                                        className="w-full sm:flex-1 font-semibold text-sm py-4 px-6 rounded-2xl flex items-center justify-center transition-all transform active:scale-[0.98] bg-slate-100 text-slate-950 hover:bg-white"
                                    >
                                        Browse Library
                                    </button>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="w-full sm:w-auto bg-slate-900 border border-white/5 hover:bg-slate-800 text-slate-300 p-4 rounded-2xl transition-colors flex items-center justify-center font-semibold text-sm gap-2"
                                    >
                                        <Plus size={18} /> Create Template
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </Section>

            {/* WEEKLY SUMMARY */}
            <Section title="This Week's Plan" action={<Link to="/plan" className="text-xs text-slate-400 hover:text-white font-semibold flex items-center">Full Plan <ChevronRight size={14} className="ml-1" /></Link>}>
                <div className="flex justify-between items-center gap-2 overflow-x-auto scrollbar-hide w-full max-w-full pb-2">
                    {weekDates.map((d, i) => {
                        const dateStr = d.toISOString().split('T')[0];
                        const isToday = dateStr === new Date().toISOString().split('T')[0];
                        const daySchedule = weekSchedule.filter(s => s.scheduled_date === dateStr);
                        const hasWorkouts = daySchedule.some(s => !s.is_rest_day);
                        const isRest = daySchedule.some(s => s.is_rest_day);

                        return (
                            <div
                                key={i}
                                onClick={() => setSelectedDaySchedule({ date: d, items: daySchedule })}
                                className={clsx(
                                    "flex flex-col flex-1 min-w-[120px] rounded-[20px] border transition-all relative overflow-hidden p-3 cursor-pointer group hover:scale-[1.02]",
                                    isToday
                                        ? "bg-slate-800 border-slate-500 text-white"
                                        : "bg-slate-900 border-white/5 text-slate-500 hover:bg-slate-800"
                                )}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={clsx("text-[10px] font-bold uppercase tracking-wider", isToday ? "text-slate-300" : "text-slate-500")}>
                                        {d.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </span>
                                    <span className={clsx("text-sm font-bold", isToday ? "text-white" : "text-slate-300")}>
                                        {d.getDate()}
                                    </span>
                                </div>

                                <div className="flex-1 flex flex-col justify-end">
                                    {daySchedule.length === 0 ? (
                                        <span className="text-[10px] text-slate-600 font-semibold mb-1 truncate block">— Rest —</span>
                                    ) : (
                                        <>
                                            {daySchedule.slice(0, 2).map((s, idx) => (
                                                <div key={idx} className="flex items-center gap-1.5 mb-1 truncate w-full">
                                                    <div className={clsx("w-1.5 h-1.5 rounded-full shrink-0", s.is_rest_day ? "bg-orange-500" : "bg-emerald-500")} />
                                                    <span className={clsx("text-[10px] font-semibold truncate", isToday ? "text-slate-200" : "text-slate-400 group-hover:text-slate-300")}>
                                                        {s.is_rest_day ? 'Rest Day' : s.workouts?.title || 'Workout'}
                                                    </span>
                                                </div>
                                            ))}
                                            {daySchedule.length > 2 && (
                                                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">+{daySchedule.length - 2} more</span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
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

            {showCreateModal && (
                <CreateWorkoutModal
                    onClose={() => setShowCreateModal(false)}
                    onWorkoutCreated={handleWorkoutCreated}
                />
            )}

            {selectedDaySchedule && (
                <DayScheduleModal
                    date={selectedDaySchedule.date}
                    scheduleItems={selectedDaySchedule.items}
                    onClose={() => setSelectedDaySchedule(null)}
                />
            )}
        </div>
    );
};

export default Home;
