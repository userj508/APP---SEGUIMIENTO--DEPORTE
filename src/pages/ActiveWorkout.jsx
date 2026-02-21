import React, { useState, useEffect } from 'react';
import { ChevronLeft, MoreHorizontal, Settings2, Dumbbell, Loader2 } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import WorkoutTimer from '../components/WorkoutTimer';
import clsx from 'clsx';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const ActiveWorkout = () => {
    const { workoutId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [elapsed, setElapsed] = useState(0);
    const [restTime, setRestTime] = useState(60);
    const [isResting, setIsResting] = useState(false);
    const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
    const [isCelebratingSet, setIsCelebratingSet] = useState(false);
    const [exercises, setExercises] = useState([]);
    const [workoutTitle, setWorkoutTitle] = useState("Workout Segment");

    // --- INITIALIZATION ---
    useEffect(() => {
        const fetchWorkoutData = async () => {
            if (!workoutId || workoutId === 'mock-1') {
                setExercises([
                    {
                        id: 'mock-1',
                        name: 'Barbell Squats',
                        targetSets: 4,
                        targetReps: 8,
                        sets: Array(4).fill(0).map((_, i) => ({ id: `m-1-${i}`, completed: false, weight: 100, reps: 8 }))
                    }
                ]);
                setLoading(false);
                return;
            }

            try {
                const { data: workout } = await supabase
                    .from('workouts')
                    .select('title')
                    .eq('id', workoutId)
                    .single();

                if (workout) setWorkoutTitle(workout.title);

                const { data: workoutExercises, error } = await supabase
                    .from('workout_exercises')
                    .select(`
                        id,
                        order_index,
                        target_sets,
                        target_reps,
                        rest_seconds,
                        exercises ( id, name, category, video_url )
                    `)
                    .eq('workout_id', workoutId)
                    .order('order_index');

                if (error) throw error;

                const formattedExercises = workoutExercises.map(we => ({
                    id: we.exercises.id,
                    workoutExerciseId: we.id,
                    name: we.exercises.name,
                    targetSets: we.target_sets,
                    targetReps: we.target_reps,
                    restSeconds: we.rest_seconds || 60,
                    sets: Array(we.target_sets).fill(0).map((_, i) => ({
                        id: `${we.id}-${i}`,
                        completed: false,
                        weight: 0,
                        reps: we.target_reps
                    }))
                }));

                // Fetch last used weights for these exercises to use as recommended
                const exerciseIds = formattedExercises.map(e => e.id);
                if (exerciseIds.length > 0) {
                    const { data: lastLogs } = await supabase
                        .from('exercise_logs')
                        .select('exercise_id, weight_kg, created_at, workout_logs!inner(user_id)')
                        .in('exercise_id', exerciseIds)
                        .eq('workout_logs.user_id', user.id)
                        .eq('is_completed', true)
                        .order('created_at', { ascending: false });

                    if (lastLogs && lastLogs.length > 0) {
                        const lastWeights = {};
                        lastLogs.forEach(log => {
                            if (!lastWeights[log.exercise_id]) {
                                lastWeights[log.exercise_id] = log.weight_kg;
                            }
                        });

                        formattedExercises.forEach(ex => {
                            if (lastWeights[ex.id]) {
                                ex.sets.forEach(s => s.weight = lastWeights[ex.id]);
                            }
                        });
                    }
                }

                setExercises(formattedExercises);
                if (formattedExercises.length > 0) {
                    setRestTime(formattedExercises[0].restSeconds);
                }

            } catch (error) {
                console.error("Error loading workout:", error);
                alert("Failed to load session details.");
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        fetchWorkoutData();
    }, [workoutId, user, navigate]);


    // --- TIMERS ---
    useEffect(() => {
        const timer = setInterval(() => setElapsed(e => e + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let interval;
        if (isResting && restTime > 0) {
            interval = setInterval(() => setRestTime(rt => rt > 0 ? rt - 1 : 0), 1000);
        } else if (isResting && restTime === 0) {
            setIsResting(false);
        }
        return () => clearInterval(interval);
    }, [isResting, restTime]);

    const formatTime = (seconds) => {
        const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
        const ss = (seconds % 60).toString().padStart(2, '0');
        return `${mm}:${ss}`;
    };

    // --- FINISH WORKOUT ---
    const activeFinishWorkout = async () => {
        setLoading(true);
        try {
            const { data: logData, error: logError } = await supabase
                .from('workout_logs')
                .insert({
                    user_id: user.id,
                    workout_id: workoutId !== 'mock-1' ? workoutId : null,
                    status: 'completed',
                    started_at: new Date(Date.now() - elapsed * 1000).toISOString(),
                    completed_at: new Date().toISOString()
                })
                .select()
                .single();

            if (logError) throw logError;

            // Insert exercise logs
            if (workoutId !== 'mock-1') {
                const exerciseLogs = [];
                exercises.forEach(ex => {
                    ex.sets.forEach((set, index) => {
                        if (set.completed) {
                            exerciseLogs.push({
                                workout_log_id: logData.id,
                                exercise_id: ex.id,
                                set_number: index + 1,
                                reps_completed: set.reps,
                                weight_kg: set.weight,
                                is_completed: true
                            });
                        }
                    });
                });

                if (exerciseLogs.length > 0) {
                    const { error: exLogError } = await supabase
                        .from('exercise_logs')
                        .insert(exerciseLogs);
                    if (exLogError) console.error("Error saving exercise logs:", exLogError);
                }
            }

            confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#fff', '#10B981', '#059669']
            });

            setTimeout(() => {
                navigate('/');
            }, 1800);

        } catch (error) {
            console.error("Error saving log:", error);
            navigate('/');
        }
    };


    // --- ACTIONS ---
    const handleMainAction = () => {
        if (isResting) {
            setIsResting(false);
        } else {
            if (activeExerciseIndex >= exercises.length) return;

            const currentEx = exercises[activeExerciseIndex];
            const currentSetIndex = currentEx.sets.findIndex(s => !s.completed);

            if (currentSetIndex === -1) return;

            setIsCelebratingSet(true);
            setTimeout(() => setIsCelebratingSet(false), 500);

            const newExercises = [...exercises];
            newExercises[activeExerciseIndex].sets[currentSetIndex].completed = true;
            setExercises(newExercises);

            const isExComplete = currentSetIndex === currentEx.sets.length - 1;

            if (!isExComplete) {
                setRestTime(currentEx.restSeconds || 60);
                setIsResting(true);
            } else {
                if (activeExerciseIndex < exercises.length - 1) {
                    setActiveExerciseIndex(prev => prev + 1);
                } else {
                    activeFinishWorkout();
                }
            }
        }
    };

    const handleSetUpdate = (field, value) => {
        const newExercises = [...exercises];
        const currentEx = newExercises[activeExerciseIndex];
        const currentSetIndex = currentEx.sets.findIndex(s => !s.completed);
        if (currentSetIndex !== -1) {
            currentEx.sets[currentSetIndex][field] = value;
            setExercises(newExercises);
        }
    };

    const handleAdjustTime = (amount) => {
        setRestTime(prev => Math.max(0, prev + amount));
    };

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-slate-500" size={32} /></div>;
    }

    if (exercises.length === 0) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 text-sm font-semibold">No exercises mapped to this session.</div>;
    }

    const currentExercise = exercises[activeExerciseIndex];
    if (!currentExercise) return null;

    const currentSetIndex = currentExercise.sets.findIndex(s => !s.completed);
    const isExerciseComplete = currentSetIndex === -1;
    const activeSetDisplay = isExerciseComplete ? currentExercise.sets.length : currentSetIndex + 1;
    const currentSetData = isExerciseComplete ? currentExercise.sets[currentExercise.sets.length - 1] : currentExercise.sets[currentSetIndex];

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col relative font-sans selection:bg-emerald-500/30">
            {/* HEADER */}
            <header className="flex justify-between items-center px-6 py-8 z-10 w-full">
                <Link to="/" className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer z-50">
                    <ChevronLeft size={18} />
                </Link>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{workoutTitle}</span>
                    <span className="font-mono text-slate-300 font-semibold">{formatTime(elapsed)}</span>
                </div>
                <button className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer z-50">
                    <MoreHorizontal size={18} />
                </button>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col relative z-0 px-6 max-h-screen overflow-y-auto pb-4">

                {/* 1. Exercise Title */}
                <div className="text-center mb-10 mt-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-white/5 text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-4">
                        <span>Set {activeSetDisplay} of {currentExercise.targetSets}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight mb-3">
                        {currentExercise.name}
                    </h1>

                    {!isExerciseComplete && !isResting && (
                        <div className="flex items-center justify-center gap-4 mt-2">
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Weight (kg)</span>
                                <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-3 py-2">
                                    <button onClick={() => handleSetUpdate('weight', Math.max(0, (currentSetData?.weight || 0) - 2.5))} className="text-slate-400 hover:text-white">-</button>
                                    <input
                                        type="number"
                                        className="w-12 bg-transparent text-center font-bold text-lg text-white outline-none"
                                        value={currentSetData?.weight || ''}
                                        onChange={(e) => handleSetUpdate('weight', Number(e.target.value))}
                                        placeholder="0"
                                    />
                                    <button onClick={() => handleSetUpdate('weight', (currentSetData?.weight || 0) + 2.5)} className="text-slate-400 hover:text-white">+</button>
                                </div>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Reps</span>
                                <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-3 py-2">
                                    <button onClick={() => handleSetUpdate('reps', Math.max(0, (currentSetData?.reps || 0) - 1))} className="text-slate-400 hover:text-white">-</button>
                                    <input
                                        type="number"
                                        className="w-12 bg-transparent text-center font-bold text-lg text-white outline-none"
                                        value={currentSetData?.reps || ''}
                                        onChange={(e) => handleSetUpdate('reps', Number(e.target.value))}
                                    />
                                    <button onClick={() => handleSetUpdate('reps', (currentSetData?.reps || 0) + 1)} className="text-slate-400 hover:text-white">+</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Central Interactive Area */}
                <div className="flex-1 flex flex-col items-center justify-start py-2">
                    <WorkoutTimer
                        isResting={isResting}
                        restTime={restTime}
                        targetReps={currentSetData.reps}
                        onAction={handleMainAction}
                        onAdjustTime={handleAdjustTime}
                        isCelebratingSet={isCelebratingSet}
                    />
                </div>

                {/* 3. Bottom Progress Strip */}
                <div className="mt-8 mb-6">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Queue</h3>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
                        {exercises.map((ex, idx) => {
                            const isActive = idx === activeExerciseIndex;
                            const isDone = idx < activeExerciseIndex;

                            return (
                                <div
                                    key={ex.id}
                                    onClick={() => setActiveExerciseIndex(idx)}
                                    className={clsx(
                                        "min-w-[150px] p-4 rounded-[20px] transition-all duration-300 cursor-pointer flex flex-col justify-between h-[100px]",
                                        isActive
                                            ? "bg-slate-900 border border-white/10 ring-1 ring-white/5"
                                            : isDone
                                                ? "bg-transparent border border-white/5 opacity-50 grayscale"
                                                : "bg-transparent border border-white/5 hover:bg-slate-900/50"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={clsx(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
                                            isActive ? "bg-white text-slate-900" : "bg-slate-900 border border-white/5 text-slate-400"
                                        )}>
                                            {idx + 1}
                                        </div>
                                    </div>
                                    <div>
                                        <p className={clsx(
                                            "text-xs font-semibold truncate transition-colors",
                                            isActive ? "text-white" : "text-slate-400"
                                        )}>{ex.name}</p>
                                        <div className="flex gap-1.5 mt-2">
                                            {ex.sets.map((s, i) => (
                                                <div
                                                    key={i}
                                                    className={clsx(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        s.completed
                                                            ? "bg-emerald-500"
                                                            : isActive
                                                                ? "bg-slate-600"
                                                                : "bg-slate-800"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ActiveWorkout;
