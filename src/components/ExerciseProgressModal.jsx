import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Activity, Dumbbell, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const ExerciseProgressModal = ({ exercise, onClose }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({
        totalSessions: 0,
        maxWeight: 0,
        totalVolume: 0
    });

    useEffect(() => {
        if (!user || !exercise) return;

        const loadProgress = async () => {
            setLoading(true);
            try {
                // Fetch completed exercise logs for this exercise and user
                const { data, error } = await supabase
                    .from('exercise_logs')
                    .select(`
                        id,
                        set_number,
                        reps_completed,
                        weight_kg,
                        created_at,
                        workout_logs!inner(user_id, completed_at)
                    `)
                    .eq('exercise_id', exercise.id)
                    .eq('is_completed', true)
                    .eq('workout_logs.user_id', user.id)
                    .order('created_at', { ascending: true }); // Chronological

                if (error) throw error;

                if (!data || data.length === 0) {
                    setLoading(false);
                    return;
                }

                // Process data to group by session/date for chart and stats
                let maxWeight = 0;
                let totalVolume = 0;
                const sessionsMap = new Map(); // Date -> { date, maxWeightInSession, totalVolumeInSession, sets: [] }

                data.forEach(log => {
                    const weight = parseFloat(log.weight_kg) || 0;
                    const reps = parseInt(log.reps_completed) || 0;
                    const volume = weight * reps;

                    if (weight > maxWeight) maxWeight = weight;
                    totalVolume += volume;

                    // Group by date
                    const logDate = new Date(log.workout_logs.completed_at || log.created_at);
                    const dateStr = logDate.toLocaleDateString();

                    if (!sessionsMap.has(dateStr)) {
                        sessionsMap.set(dateStr, {
                            date: logDate,
                            dateStr: dateStr,
                            maxWeightInSession: 0,
                            totalVolumeInSession: 0,
                            sets: []
                        });
                    }

                    const session = sessionsMap.get(dateStr);
                    if (weight > session.maxWeightInSession) {
                        session.maxWeightInSession = weight;
                    }
                    session.totalVolumeInSession += volume;
                    session.sets.push({ weight, reps, setNumber: log.set_number });
                });

                const sortedSessions = Array.from(sessionsMap.values()).sort((a, b) => a.date - b.date);

                setHistory(sortedSessions);
                setStats({
                    totalSessions: sortedSessions.length,
                    maxWeight,
                    totalVolume
                });

            } catch (err) {
                console.error("Error loading exercise progress:", err);
            } finally {
                setLoading(false);
            }
        };

        loadProgress();
    }, [user, exercise]);

    // Very simple max weight calculation for chart scaling
    const highestWeightAllTime = Math.max(...history.map(s => s.maxWeightInSession), 1); // fallback to 1 to avoid div by 0

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="bg-slate-950 border-t sm:border border-white/5 sm:rounded-[24px] rounded-t-[24px] w-full max-w-[500px] h-[85vh] sm:h-auto sm:max-h-[85vh] flex flex-col relative animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in duration-300 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="shrink-0 p-6 border-b border-white/5 flex justify-between items-start bg-slate-900/50">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {exercise?.category || 'Exercise'}
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">{exercise?.name}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-900 border border-white/5 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center p-12">
                        <Loader2 className="animate-spin text-emerald-500" size={32} />
                    </div>
                ) : history.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-12 text-center flex-col">
                        <Dumbbell className="text-slate-700 mb-4" size={48} />
                        <p className="text-slate-400 font-medium">No history found for this exercise.</p>
                        <p className="text-xs text-slate-500 mt-2">Log this exercise in a workout to track stats.</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            <div className="bg-slate-900 rounded-[16px] p-4 text-center border border-white/5">
                                <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-widest">Sessions</span>
                                <span className="text-xl font-bold text-white">{stats.totalSessions}</span>
                            </div>
                            <div className="bg-slate-900 rounded-[16px] p-4 text-center border border-white/5">
                                <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-widest">PR Weight</span>
                                <div className="flex items-baseline justify-center">
                                    <span className="text-xl font-bold text-emerald-400">{stats.maxWeight}</span>
                                    <span className="text-xs text-slate-500 ml-1">kg</span>
                                </div>
                            </div>
                            <div className="bg-slate-900 rounded-[16px] p-4 text-center border border-white/5 truncate">
                                <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-widest">Volume</span>
                                <span className="text-xl font-bold text-white">{stats.totalVolume}</span>
                            </div>
                        </div>

                        {/* Chart (Simplified CSS Bar Chart) */}
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <TrendingUp size={16} className="text-emerald-500" />
                                    Weight Progression
                                </h3>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Max Weight per Session</span>
                            </div>

                            <div className="bg-slate-900 rounded-[20px] p-5 border border-white/5">
                                <div className="h-40 flex items-end gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                    {history.map((session, i) => {
                                        const heightPercent = Math.max((session.maxWeightInSession / highestWeightAllTime) * 100, 5); // min 5% height
                                        const isRecord = session.maxWeightInSession === highestWeightAllTime;

                                        return (
                                            <div key={i} className="flex flex-col items-center gap-2 min-w-[32px] group">
                                                <div className="flex flex-col items-center w-full justify-end h-full">
                                                    <span className="text-[10px] text-slate-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-1 whitespace-nowrap">
                                                        {session.maxWeightInSession}kg
                                                    </span>
                                                    <div
                                                        className={`w-full rounded-t-sm transition-all duration-500 ${isRecord ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-700 group-hover:bg-slate-500'}`}
                                                        style={{ height: `${heightPercent}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[9px] text-slate-500 font-semibold truncate max-w-[40px] text-center">
                                                    {session.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Recent Sessions List */}
                        <div>
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <Activity size={16} className="text-slate-400" />
                                Session History
                            </h3>
                            <div className="space-y-3">
                                {[...history].reverse().map((session, i) => (
                                    <div key={i} className="bg-slate-900 border border-white/5 rounded-[16px] p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-sm font-bold text-white">{session.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-950 px-2 py-1 rounded-md border border-white/5">
                                                Volume: {session.totalVolumeInSession}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {session.sets.map((set, setIdx) => (
                                                <div key={setIdx} className="bg-slate-950 rounded-lg p-2.5 flex justify-between items-center border border-white/5">
                                                    <span className="text-[10px] text-slate-500 font-bold">Set {set.setNumber || setIdx + 1}</span>
                                                    <div className="text-xs font-bold text-white">
                                                        <span className={set.weight === highestWeightAllTime ? 'text-emerald-400' : ''}>{set.weight}kg</span>
                                                        <span className="text-slate-500 mx-1">×</span>
                                                        <span>{set.reps}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExerciseProgressModal;
