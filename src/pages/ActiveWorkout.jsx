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

                // Fetch configured defaults first
                const exerciseIds = formattedExercises.map(e => e.id);
                if (exerciseIds.length > 0) {
                    const { data: defaultsData } = await supabase
                        .from('user_exercise_defaults')
                        .select('exercise_id, default_weight_kg, default_reps')
                        .eq('user_id', user.id)
                        .in('exercise_id', exerciseIds);

                    const userDefaults = {};
                    if (defaultsData) {
                        defaultsData.forEach(d => {
                            userDefaults[d.exercise_id] = { weight: d.default_weight_kg, reps: d.default_reps };
                        });
                    }

                    // Fetch last used weights as fallback
                    const { data: lastLogs } = await supabase
                        .from('exercise_logs')
                        .select('exercise_id, weight_kg, created_at, workout_logs!inner(user_id)')
                        .in('exercise_id', exerciseIds)
                        .eq('workout_logs.user_id', user.id)
                        .eq('is_completed', true)
                        .order('created_at', { ascending: false });

                    const lastWeights = {};
                    if (lastLogs && lastLogs.length > 0) {
                        lastLogs.forEach(log => {
                            if (!lastWeights[log.exercise_id]) {
                                lastWeights[log.exercise_id] = log.weight_kg;
                            }
                        });
                    }

                    // Apply to exercises
                    formattedExercises.forEach(ex => {
                        ex.sets.forEach(s => {
                            if (userDefaults[ex.id]?.weight !== undefined && userDefaults[ex.id]?.weight !== null) {
                                s.weight = userDefaults[ex.id].weight;
                            } else if (lastWeights[ex.id]) {
                                s.weight = lastWeights[ex.id];
                            }

                            if (userDefaults[ex.id]?.reps !== undefined && userDefaults[ex.id]?.reps !== null) {
                                s.reps = userDefaults[ex.id].reps;
                            }
                        });
                    });
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
        <div className="min-h-screen bg-sikan-cream text-sikan-green flex flex-col relative font-sans selection:bg-sikan-gold/30">
            {/* SIKAN HEADER */}
            <header className="flex justify-between items-center px-6 py-8 z-10 w-full">
                <Link to="/" className="w-10 h-10 flex items-center justify-start text-sikan-green/50 hover:text-sikan-green transition-colors cursor-pointer z-50">
                    <ChevronLeft size={24} strokeWidth={1.5} />
                </Link>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-sikan-gold uppercase tracking-[0.2em] mb-1">SIKAN</span>
                    <span className="font-serif text-sikan-green/80 font-medium tracking-wider text-sm">{formatTime(elapsed)}</span>
                </div>
                <button className="w-10 h-10 flex items-center justify-end text-sikan-green/50 hover:text-sikan-green transition-colors cursor-pointer z-50">
                    <MoreHorizontal size={24} strokeWidth={1.5} />
                </button>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col relative z-0 px-6 max-h-screen overflow-y-auto pb-4">

                {/* 1. Exercise Title */}
                <div className="text-center mb-10 mt-2">
                    <div className="inline-flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-medium text-sikan-gold tracking-[0.2em] uppercase">Set {activeSetDisplay} of {currentExercise.targetSets}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif text-sikan-green tracking-tight leading-tight mb-6">
                        {currentExercise.name}
                    </h1>

                    {!isExerciseComplete && !isResting && (
                        <div className="flex items-center justify-center gap-6 mt-4">
                            <div className="flex flex-col items-center">
                                <span className="text-[9px] text-sikan-green/50 uppercase font-bold tracking-[0.2em] mb-2">Weight <span className="lowercase">kg</span></span>
                                <div className="flex items-center gap-3 bg-white border border-sikan-gold/20 rounded-2xl px-4 py-2.5 shadow-[0_2px_10px_rgba(42,58,47,0.02)]">
                                    <button onClick={() => handleSetUpdate('weight', Math.max(0, (currentSetData?.weight || 0) - 2.5))} className="text-sikan-green/40 hover:text-sikan-green transition-colors text-lg">-</button>
                                    <input
                                        type="number"
                                        className="w-16 bg-transparent text-center font-serif text-2xl text-sikan-green outline-none"
                                        value={currentSetData?.weight || ''}
                                        onChange={(e) => handleSetUpdate('weight', Number(e.target.value))}
                                        placeholder="0"
                                    />
                                    <button onClick={() => handleSetUpdate('weight', (currentSetData?.weight || 0) + 2.5)} className="text-sikan-green/40 hover:text-sikan-green transition-colors text-lg">+</button>
                                </div>
                            </div>
                            <div className="w-[1px] h-10 bg-sikan-gold/20"></div>
                            <div className="flex flex-col items-center">
                                <span className="text-[9px] text-sikan-green/50 uppercase font-bold tracking-[0.2em] mb-2">Reps</span>
                                <div className="flex items-center gap-3 bg-white border border-sikan-gold/20 rounded-2xl px-4 py-2.5 shadow-[0_2px_10px_rgba(42,58,47,0.02)]">
                                    <button onClick={() => handleSetUpdate('reps', Math.max(0, (currentSetData?.reps || 0) - 1))} className="text-sikan-green/40 hover:text-sikan-green transition-colors text-lg">-</button>
                                    <input
                                        type="number"
                                        className="w-12 bg-transparent text-center font-serif text-2xl text-sikan-green outline-none"
                                        value={currentSetData?.reps || ''}
                                        onChange={(e) => handleSetUpdate('reps', Number(e.target.value))}
                                    />
                                    <button onClick={() => handleSetUpdate('reps', (currentSetData?.reps || 0) + 1)} className="text-sikan-green/40 hover:text-sikan-green transition-colors text-lg">+</button>
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
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
                        {exercises.map((ex, idx) => {
                            const isActive = idx === activeExerciseIndex;
                            const isDone = idx < activeExerciseIndex;

                            return (
                                <div
                                    key={ex.id}
                                    onClick={() => setActiveExerciseIndex(idx)}
                                    className={clsx(
                                        "min-w-[160px] p-4 rounded-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between h-[100px]",
                                        isActive
                                            ? "bg-white shadow-[0_4px_20px_rgba(42,58,47,0.06)] border border-sikan-gold/30"
                                            : isDone
                                                ? "bg-transparent border border-sikan-green/10 opacity-40"
                                                : "bg-transparent border border-sikan-green/10 hover:bg-white/50"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={clsx(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-serif transition-colors",
                                            isActive ? "bg-sikan-green text-sikan-cream" : "bg-sikan-green/5 text-sikan-green/50"
                                        )}>
                                            {idx + 1}
                                        </div>
                                    </div>
                                    <div>
                                        <p className={clsx(
                                            "text-xs font-medium truncate transition-colors",
                                            isActive ? "text-sikan-green" : "text-sikan-green/60"
                                        )}>{ex.name}</p>
                                        <div className="flex gap-1.5 mt-2">
                                            {ex.sets.map((s, i) => (
                                                <div
                                                    key={i}
                                                    className={clsx(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        s.completed
                                                            ? "bg-sikan-gold"
                                                            : isActive
                                                                ? "bg-sikan-green/20"
                                                                : "bg-sikan-green/10"
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
