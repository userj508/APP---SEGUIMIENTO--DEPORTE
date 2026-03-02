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
        <div className="fixed inset-0 bg-sikan-dark/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="bg-sikan-card border-t sm:border border-sikan-border sm:rounded-[24px] rounded-t-[24px] w-full max-w-[500px] h-[85vh] sm:h-auto sm:max-h-[85vh] flex flex-col relative animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in duration-300 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="shrink-0 p-6 border-b border-sikan-border flex justify-between items-start bg-sikan-bg/50">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sikan-bg border border-sikan-border text-[10px] font-bold uppercase tracking-wider text-sikan-olive mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-sikan-gold"></span>
                            {exercise?.category || 'Exercise'}
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-sikan-dark tracking-tight">{exercise?.name}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-sikan-bg border border-sikan-border text-sikan-muted hover:text-sikan-dark shadow-sm transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center p-12">
                        <Loader2 className="animate-spin text-sikan-olive" size={32} />
                    </div>
                ) : history.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-12 text-center flex-col">
                        <Dumbbell className="text-sikan-muted mb-4" size={48} />
                        <p className="text-sikan-dark font-bold">No history found for this exercise.</p>
                        <p className="text-xs text-sikan-muted font-bold mt-2">Log this exercise in a workout to track stats.</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            <div className="bg-sikan-card rounded-[16px] p-4 text-center border border-sikan-border shadow-sm">
                                <span className="block text-[10px] font-bold uppercase text-sikan-muted mb-1 tracking-widest">Sessions</span>
                                <span className="text-xl font-bold font-serif text-sikan-dark">{stats.totalSessions}</span>
                            </div>
                            <div className="bg-sikan-card rounded-[16px] p-4 text-center border border-sikan-border shadow-sm">
                                <span className="block text-[10px] font-bold uppercase text-sikan-muted mb-1 tracking-widest">PR Weight</span>
                                <div className="flex items-baseline justify-center">
                                    <span className="text-xl font-bold font-serif text-sikan-olive">{stats.maxWeight}</span>
                                    <span className="text-xs font-bold text-sikan-muted ml-1">kg</span>
                                </div>
                            </div>
                            <div className="bg-sikan-card rounded-[16px] p-4 text-center border border-sikan-border shadow-sm truncate">
                                <span className="block text-[10px] font-bold uppercase text-sikan-muted mb-1 tracking-widest">Volume</span>
                                <span className="text-xl font-bold font-serif text-sikan-dark">{stats.totalVolume}</span>
                            </div>
                        </div>

                        {/* Chart (Simplified CSS Bar Chart) */}
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold font-serif text-sikan-dark flex items-center gap-2">
                                    <TrendingUp size={16} className="text-sikan-olive" />
                                    Weight Progression
                                </h3>
                                <span className="text-[10px] text-sikan-muted font-bold uppercase tracking-widest">Max Weight per Session</span>
                            </div>

                            <div className="bg-sikan-card rounded-[20px] p-5 border border-sikan-border shadow-sm">
                                <div className="h-40 flex items-end gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                    {history.map((session, i) => {
                                        const heightPercent = Math.max((session.maxWeightInSession / highestWeightAllTime) * 100, 5); // min 5% height
                                        const isRecord = session.maxWeightInSession === highestWeightAllTime;

                                        return (
                                            <div key={i} className="flex flex-col items-center gap-2 min-w-[32px] group">
                                                <div className="flex flex-col items-center w-full justify-end h-full">
                                                    <span className="text-[10px] text-sikan-dark font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-1 whitespace-nowrap">
                                                        {session.maxWeightInSession}kg
                                                    </span>
                                                    <div
                                                        className={`w-full rounded-t-sm transition-all duration-500 ${isRecord ? 'bg-sikan-gold shadow-sm' : 'bg-[#EAE4DC] group-hover:bg-[#E3C7A1]'}`}
                                                        style={{ height: `${heightPercent}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[9px] text-sikan-muted font-bold truncate max-w-[40px] text-center">
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
                            <h3 className="text-sm font-bold font-serif text-sikan-dark mb-4 flex items-center gap-2">
                                <Activity size={16} className="text-sikan-muted" />
                                Session History
                            </h3>
                            <div className="space-y-3">
                                {[...history].reverse().map((session, i) => (
                                    <div key={i} className="bg-sikan-card border border-sikan-border shadow-sm rounded-[16px] p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-sm font-bold text-sikan-dark">{session.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-sikan-muted bg-sikan-bg px-2 py-1 rounded-md border border-sikan-border">
                                                Volume: {session.totalVolumeInSession}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {session.sets.map((set, setIdx) => (
                                                <div key={setIdx} className="bg-sikan-bg rounded-lg p-2.5 flex justify-between items-center border border-sikan-border">
                                                    <span className="text-[10px] text-sikan-muted font-bold">Set {set.setNumber || setIdx + 1}</span>
                                                    <div className="text-xs font-bold text-sikan-dark">
                                                        <span className={set.weight === highestWeightAllTime ? 'text-sikan-olive' : ''}>{set.weight}kg</span>
                                                        <span className="text-sikan-muted mx-1">×</span>
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
