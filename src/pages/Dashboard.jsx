import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Clock, Activity, Calendar, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Dashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSessions: 0,
        totalDurationMinutes: 0,
        currentStreak: 0,
        weeklyData: [],
        recentMilestones: []
    });

    useEffect(() => {
        if (!user) return;

        const loadDashboardData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Completed Workout Logs for user
                const { data: logs, error } = await supabase
                    .from('workout_logs')
                    .select('*, workouts(title)')
                    .eq('user_id', user.id)
                    .eq('status', 'completed')
                    .order('completed_at', { ascending: false });

                if (error) throw error;

                // 2. Calculate Total Sessions
                const totalSessions = logs?.length || 0;

                // 3. Calculate Total Duration
                let totalMin = 0;
                logs?.forEach(log => {
                    if (log.started_at && log.completed_at) {
                        const start = new Date(log.started_at);
                        const end = new Date(log.completed_at);
                        const diffMins = Math.floor((end - start) / (1000 * 60));
                        if (diffMins > 0 && diffMins < 600) { // sanity check
                            totalMin += diffMins;
                        }
                    }
                });

                // 4. Calculate Current Streak
                let streak = 0;
                let currentDate = new Date();
                currentDate.setHours(0, 0, 0, 0);

                // Create a Set of all unique local dates the user worked out
                const activeDates = new Set(logs?.map(log => {
                    const d = new Date(log.completed_at);
                    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                }));

                // Check streak backwards from today
                for (let i = 0; i < 365; i++) {
                    const checkDate = new Date(currentDate);
                    checkDate.setDate(currentDate.getDate() - i);
                    const dateStr = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;

                    if (activeDates.has(dateStr)) {
                        streak++;
                    } else if (i === 0) {
                        // If didn't workout today, streak is not broken yet (could workout later), 
                        // so we just continue to check yesterday.
                        continue;
                    } else {
                        // A past day was missed, streak broken
                        break;
                    }
                }

                // 5. Generate Weekly Consistency Data (Last 7 Days)
                const weekDays = [];
                const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

                for (let i = 6; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

                    weekDays.push({
                        day: dayNames[date.getDay()],
                        active: activeDates.has(dateStr),
                        height: activeDates.has(dateStr) ? 'h-12' : 'h-1.5' // Simple binary height for now
                    });
                }

                // 6. Recent Milestones (using latest 3 logs)
                const recentLogs = logs?.slice(0, 3) || [];
                const milestones = recentLogs.map(log => {
                    const d = new Date(log.completed_at);
                    const today = new Date();
                    const diffDays = Math.floor((today - d) / (1000 * 60 * 60 * 24));
                    let timeText = 'Today';
                    if (diffDays === 1) timeText = '1d ago';
                    if (diffDays > 1) timeText = `${diffDays}d ago`;

                    return {
                        id: log.id,
                        title: log.workouts?.title || 'Custom Session',
                        timeText: timeText,
                        icon: Activity,
                        desc: "Completed successfully"
                    };
                });

                setStats({
                    totalSessions,
                    totalDurationMinutes: totalMin,
                    currentStreak: streak,
                    weeklyData: weekDays,
                    recentMilestones: milestones
                });

            } catch (err) {
                console.error("Error loading dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [user]);

    const hours = Math.floor(stats.totalDurationMinutes / 60);
    const minutes = stats.totalDurationMinutes % 60;

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-slate-500" size={32} /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white px-5 pt-10 pb-28 font-sans selection:bg-emerald-500/30">
            <header className="mb-10 flex justify-between items-center">
                <div>
                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Overview</h2>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Progress</h1>
                </div>
                <button className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 text-slate-300 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-colors">
                    <Calendar size={18} />
                </button>
            </header>

            {/* Weekly Consistency */}
            <section className="mb-8">
                <div className="flex justify-between items-end mb-4">
                    <h2 className="text-lg font-bold">Consistency</h2>
                    <span className="text-xs font-semibold text-emerald-500">
                        {stats.currentStreak > 0 ? `${stats.currentStreak} Day Streak!` : 'Keep going!'}
                    </span>
                </div>
                <div className="bg-slate-900 p-6 rounded-[24px] border border-white/5 relative overflow-hidden">
                    <div className="flex justify-between items-end h-28 mb-1 relative z-10 w-full px-2">
                        {stats.weeklyData.map((day, index) => (
                            <div key={index} className="flex flex-col items-center group w-full relative">
                                <div
                                    className={`w-2 transition-all duration-700 ease-out rounded-full ${day.active ? 'bg-slate-200 group-hover:bg-white' : 'bg-slate-800'} ${day.height}`}
                                ></div>
                                <span className="text-[10px] text-slate-500 font-bold uppercase mt-4">{day.day}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Cards */}
            <section className="grid grid-cols-2 gap-3 mb-10">
                <div className="bg-slate-900 p-5 rounded-[20px] border border-white/5 flex flex-col justify-between min-h-[110px]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Sessions</span>
                    <div className="flex items-baseline gap-2 mt-auto">
                        <span className="text-3xl font-bold tracking-tight text-white">{stats.totalSessions}</span>
                    </div>
                </div>
                <div className="bg-slate-900 p-5 rounded-[20px] border border-white/5 flex flex-col justify-between min-h-[110px] overflow-hidden">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">Duration</span>
                    <div className="flex items-baseline mt-auto">
                        <span className="text-3xl font-bold tracking-tight text-white">{hours}</span>
                        <span className="text-xs text-slate-500 font-semibold ml-0.5 mr-1.5">h</span>
                        <span className="text-3xl font-bold tracking-tight text-white">{minutes}</span>
                        <span className="text-xs text-slate-500 font-semibold ml-0.5">m</span>
                    </div>
                </div>
                <div className="bg-slate-900 p-5 rounded-[20px] border border-white/5 flex items-center justify-between col-span-2">
                    <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Current Streak</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight text-white">{stats.currentStreak}</span>
                            <span className="text-xs text-slate-400 font-semibold">Days</span>
                        </div>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-inner shadow-black/20 ${stats.currentStreak > 0 ? 'bg-orange-500/10 text-orange-500' : 'bg-slate-800 text-slate-600'}`}>
                        <Flame size={20} className="fill-current" />
                    </div>
                </div>
            </section>

            {/* Recent History / Milestones */}
            <section>
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-bold">Recent History</h2>
                </div>

                {stats.recentMilestones.length > 0 ? (
                    <div className="space-y-3">
                        {stats.recentMilestones.map((milestone, idx) => {
                            const Icon = milestone.icon;
                            return (
                                <div key={idx} className="flex items-center p-4 bg-slate-900 rounded-[20px] border border-white/5 group transition-colors hover:border-white/10">
                                    <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center text-slate-300 mr-4 border border-white/5 shadow-inner">
                                        <Icon size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-bold text-white text-sm">{milestone.title}</h3>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">{milestone.timeText}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5">{milestone.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 px-6 bg-slate-900 border border-white/5 border-dashed rounded-[24px]">
                        <Trophy size={24} className="mx-auto text-slate-600 mb-3" />
                        <p className="text-sm font-medium text-slate-400">No sessions recorded yet.</p>
                        <p className="text-xs text-slate-500 mt-1">Complete a workout to see your history.</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Dashboard;
