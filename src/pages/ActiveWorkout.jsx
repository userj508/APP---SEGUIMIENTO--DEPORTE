import React, { useState, useEffect } from 'react';
import { ChevronLeft, MoreVertical, Settings2, Dumbbell, Loader2 } from 'lucide-react';
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
    const [restTime, setRestTime] = useState(60); // Default rest
    const [isResting, setIsResting] = useState(false);
    const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
    const [isCelebratingSet, setIsCelebratingSet] = useState(false);
    const [exercises, setExercises] = useState([]);
    const [workoutTitle, setWorkoutTitle] = useState("Workout");

    // --- INITIALIZATION ---
    useEffect(() => {
        const fetchWorkoutData = async () => {
            if (!workoutId) {
                // Mock data fallback for direct access without ID (or redirect)
                // For now, let's just load a default mock if no ID
                setExercises([
                    {
                        id: 'mock-1',
                        name: 'Barbell Squats (Demo)',
                        targetSets: 4,
                        targetReps: 8,
                        sets: Array(4).fill(0).map((_, i) => ({ id: `m-1-${i}`, completed: false, weight: 100, reps: 8 }))
                    }
                ]);
                setLoading(false);
                return;
            }

            try {
                // 1. Fetch Workout Details
                const { data: workout } = await supabase
                    .from('workouts')
                    .select('title')
                    .eq('id', workoutId)
                    .single();

                if (workout) setWorkoutTitle(workout.title);

                // 2. Fetch Exercises joined with workout_exercises
                // We need to get the exercises in order
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

                // 3. Transform to local state format
                const formattedExercises = workoutExercises.map(we => ({
                    id: we.exercises.id, // Actual exercise ID
                    workoutExerciseId: we.id, // Link for logging
                    name: we.exercises.name,
                    targetSets: we.target_sets,
                    targetReps: we.target_reps,
                    restSeconds: we.rest_seconds || 60,
                    sets: Array(we.target_sets).fill(0).map((_, i) => ({
                        id: `${we.id}-${i}`,
                        completed: false,
                        weight: 0, // In a real app, we'd fetch previous weights here
                        reps: we.target_reps
                    }))
                }));

                setExercises(formattedExercises);
                if (formattedExercises.length > 0) {
                    setRestTime(formattedExercises[0].restSeconds);
                }

            } catch (error) {
                console.error("Error loading workout:", error);
                alert("Failed to load workout. Please try again.");
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
            setIsResting(false); // Auto-finish rest
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
            const { data: log, error: logError } = await supabase
                .from('workout_logs')
                .insert({
                    user_id: user.id,
                    workout_id: workoutId, // might be null if ad-hoc/mock
                    status: 'completed',
                    started_at: new Date(Date.now() - elapsed * 1000).toISOString(),
                    completed_at: new Date().toISOString()
                })
                .select()
                .single();

            if (logError) throw logError;

            // Log Exercises (simplified: just marking completed for now)
            // In a full app, we would loop through all sets and save them to exercise_logs

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10B981', '#34D399', '#059669', '#ffffff']
            });

            setTimeout(() => {
                alert("Workout Saved!");
                navigate('/');
            }, 2000);

        } catch (error) {
            console.error("Error saving log:", error);
            alert("Error saving workout, but great job!");
            navigate('/');
        }
    };


    // --- ACTIONS ---
    const handleMainAction = () => {
        if (isResting) {
            setIsResting(false);
        } else {
            // FINISH SET
            if (activeExerciseIndex >= exercises.length) return; // Safety

            const currentEx = exercises[activeExerciseIndex];
            const currentSetIndex = currentEx.sets.findIndex(s => !s.completed);

            if (currentSetIndex === -1) return; // Logic error, exercise shouldn't be active if done

            // Animate
            setIsCelebratingSet(true);
            setTimeout(() => setIsCelebratingSet(false), 500);

            // Update State
            const newExercises = [...exercises];
            newExercises[activeExerciseIndex].sets[currentSetIndex].completed = true;
            setExercises(newExercises);

            // Check what's next
            const isExComplete = currentSetIndex === currentEx.sets.length - 1;

            if (!isExComplete) {
                // Rest between sets
                setRestTime(currentEx.restSeconds || 60);
                setIsResting(true);
            } else {
                // Exercise Done
                if (activeExerciseIndex < exercises.length - 1) {
                    // Go to next exercise
                    setActiveExerciseIndex(prev => prev + 1);
                    // Optional: Rest between exercises?
                } else {
                    // WORKOUT COMPLETE
                    activeFinishWorkout();
                }
            }
        }
    };

    const handleAdjustTime = (amount) => {
        setRestTime(prev => Math.max(0, prev + amount));
    };

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500"><Loader2 className="animate-spin" size={40} /></div>;
    }

    if (exercises.length === 0) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">No exercises found.</div>;
    }

    const currentExercise = exercises[activeExerciseIndex];
    // Safety check
    if (!currentExercise) return null;

    const currentSetIndex = currentExercise.sets.findIndex(s => !s.completed);
    const isExerciseComplete = currentSetIndex === -1;
    const activeSetDisplay = isExerciseComplete ? currentExercise.sets.length : currentSetIndex + 1;
    const currentSetData = isExerciseComplete ? currentExercise.sets[currentExercise.sets.length - 1] : currentExercise.sets[currentSetIndex];

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-emerald-900/10 to-transparent pointer-events-none" />

            {/* HEADER */}
            <header className="flex justify-between items-center p-6 z-10 w-full">
                <Link to="/" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer z-50">
                    <ChevronLeft size={20} />
                </Link>
                <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">{workoutTitle}</span>
                    <span className="font-mono text-slate-400 text-sm">{formatTime(elapsed)}</span>
                </div>
                <button className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer z-50">
                    <Settings2 size={20} />
                </button>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col relative z-0 px-6 max-h-screen overflow-y-auto pb-4">

                {/* 1. Exercise Title */}
                <div className="text-center mb-8 mt-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-800 text-xs font-bold text-slate-400 mb-3">
                        <Dumbbell size={12} />
                        <span>Set {activeSetDisplay} of {currentExercise.targetSets}</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight mb-2">
                        {currentExercise.name}
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">{currentSetData.weight > 0 ? `${currentSetData.weight}kg • ` : ''}Target: {currentExercise.targetReps} reps</p>
                </div>

                {/* 2. Central Interactive Area */}
                <div className="flex-1 flex flex-col items-center justify-start py-4">
                    <WorkoutTimer
                        isResting={isResting}
                        restTime={restTime}
                        targetReps={currentSetData.reps} // Use current set reps
                        onAction={handleMainAction}
                        onAdjustTime={handleAdjustTime}
                        isCelebratingSet={isCelebratingSet}
                    />
                </div>

                {/* 3. Bottom Progress Strip - Fixed to bottom of content area */}
                <div className="mt-auto pt-4">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Up Next</h3>
                        <span className="text-xs font-bold text-emerald-500 cursor-pointer">Edit Queue</span>
                    </div>

                    {/* Horizontal Scroll List */}
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
                        {exercises.map((ex, idx) => {
                            const isActive = idx === activeExerciseIndex;
                            const isDone = idx < activeExerciseIndex;

                            return (
                                <div
                                    key={ex.id}
                                    onClick={() => setActiveExerciseIndex(idx)}
                                    className={clsx(
                                        "min-w-[140px] p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between h-[100px]",
                                        isActive
                                            ? "bg-slate-800 border-emerald-500 ring-4 ring-emerald-500/10 shadow-2xl shadow-emerald-900/40 scale-105 z-10" // Active: POP
                                            : isDone
                                                ? "bg-transparent border-slate-800/50 opacity-40 grayscale" // Done: Recede
                                                : "bg-transparent border-slate-800/50 hover:border-slate-700 hover:bg-slate-900/30" // Pending: Ghost
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={clsx(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
                                            isActive ? "bg-emerald-500 text-slate-900" : "bg-slate-800/50 text-slate-600"
                                        )}>
                                            {idx + 1}
                                        </div>
                                        {isDone && <span className="text-[10px] font-bold text-emerald-500">DONE</span>}
                                    </div>
                                    <div>
                                        <p className={clsx(
                                            "text-sm font-bold truncate transition-colors",
                                            isActive ? "text-white" : "text-slate-500" // Dimmer text for pending
                                        )}>{ex.name}</p>
                                        <div className="flex gap-1 mt-2">
                                            {ex.sets.map((s, i) => (
                                                <div
                                                    key={i}
                                                    className={clsx(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        s.completed
                                                            ? "bg-emerald-500"
                                                            : isActive
                                                                ? "bg-slate-600"
                                                                : "bg-slate-800" // Very dark dots for pending
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
