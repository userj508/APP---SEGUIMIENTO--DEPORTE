import React, { useState, useEffect } from 'react';
import { Plus, SlidersHorizontal, Wand2, Loader2, Calendar } from 'lucide-react';
import WeeklyPlanner from '../components/WeeklyPlanner';
import WorkoutCard from '../components/WorkoutCard';
import Section from '../components/Section';
import CreateWorkoutModal from '../components/CreateWorkoutModal';
import ScheduleWorkoutModal from '../components/ScheduleWorkoutModal';
import ExerciseDefaultsModal from '../components/ExerciseDefaultsModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Plan = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [workoutToSchedule, setWorkoutToSchedule] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [workoutToDelete, setWorkoutToDelete] = useState(null);

    // Exercise Library State
    const [exercises, setExercises] = useState([]);
    const [selectedExerciseForDefaults, setSelectedExerciseForDefaults] = useState(null);

    useEffect(() => {
        if (!user) return;

        const fetchWorkouts = async () => {
            try {
                const { data: workoutsData, error: workoutsError } = await supabase
                    .from('workouts')
                    .select('*')
                    .or(`user_id.eq.${user.id},user_id.is.null`)
                    .order('created_at', { ascending: false });

                if (workoutsError) throw workoutsError;
                setWorkouts(workoutsData || []);

                const { data: exercisesData, error: exercisesError } = await supabase
                    .from('exercises')
                    .select('*')
                    .order('name');

                if (exercisesError) throw exercisesError;
                setExercises(exercisesData || []);

            } catch (error) {
                console.error("Error fetching workouts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkouts();
    }, [user]);

    const handleWorkoutCreated = (newWorkout) => {
        setWorkouts([newWorkout, ...workouts]);
    };

    const handleScheduleComplete = () => {
        setWorkoutToSchedule(null);
        setRefreshTrigger(prev => prev + 1);
    };

    const handleDeleteWorkout = async () => {
        if (!workoutToDelete) return;

        try {
            const { error } = await supabase
                .from('workouts')
                .delete()
                .eq('id', workoutToDelete.id)
                .eq('user_id', user.id);

            if (error) throw error;

            setWorkouts(workouts.filter(w => w.id !== workoutToDelete.id));
            setWorkoutToDelete(null);
        } catch (error) {
            console.error("Error deleting workout:", error);
            alert("Failed to delete workout. Please try again.");
            setWorkoutToDelete(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white px-5 pt-10 pb-28 font-sans selection:bg-emerald-500/30">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Schedule</h2>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Plan & Build</h1>
                </div>
                <button className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 text-slate-300 flex items-center justify-center hover:bg-slate-800 transition-colors">
                    <SlidersHorizontal size={18} />
                </button>
            </header>

            {/* Weekly Calendar Component */}
            <WeeklyPlanner key={refreshTrigger} />

            {/* Core Actions */}
            <div className="grid grid-cols-2 gap-3 mb-10">
                <button className="flex flex-col items-start justify-center p-5 rounded-[20px] bg-slate-100 text-slate-950 active:scale-[0.98] transition-transform shadow-lg shadow-white/5">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mb-3">
                        <Wand2 size={16} />
                    </div>
                    <span className="text-sm font-bold">Generate Plan</span>
                    <span className="text-[10px] font-medium text-slate-600 mt-0.5">AI Powered</span>
                </button>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex flex-col items-start justify-center p-5 rounded-[20px] bg-slate-900 border border-white/5 text-slate-200 hover:bg-slate-800 transition-colors active:scale-[0.98]"
                >
                    <div className="w-8 h-8 rounded-full bg-slate-950 border border-white/5 flex items-center justify-center mb-3 text-slate-400">
                        <Plus size={16} />
                    </div>
                    <span className="text-sm font-bold">Create Custom</span>
                    <span className="text-[10px] font-medium text-slate-500 mt-0.5">Manual Builder</span>
                </button>
            </div>

            {/* Saved Workouts */}
            <Section title="Library Workouts" action={<button className="text-xs text-slate-400 hover:text-white font-semibold transition-colors">View All</button>}>
                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin tracking-tight text-emerald-500" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {workouts.map(workout => (
                            <WorkoutCard
                                key={workout.id}
                                title={workout.title}
                                duration={workout.duration_minutes}
                                type={workout.type}
                                level={workout.difficulty}
                                onStart={() => navigate(`/workout/${workout.id}`)}
                                onSchedule={() => setWorkoutToSchedule(workout)}
                                onDelete={workout.user_id === user?.id ? () => setWorkoutToDelete(workout) : undefined}
                            />
                        ))}

                        {/* Minimalist Add Placeholder */}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="rounded-[20px] flex flex-col items-center justify-center min-h-[160px] border border-dashed border-white/10 hover:border-slate-500 hover:bg-slate-900/50 transition-all text-slate-500 group"
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Plus size={20} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">New Template</span>
                        </button>
                    </div>
                )}
            </Section>

            {/* Exercise Library */}
            <Section title="Exercise Configuration" action={<span className="text-xs text-slate-400 font-semibold">{exercises.length} Exercises</span>}>
                {loading ? (
                    <div className="flex justify-center py-6"><Loader2 className="animate-spin tracking-tight text-emerald-500" /></div>
                ) : (
                    <div className="bg-slate-900 border border-white/5 rounded-[24px] overflow-hidden">
                        <div className="max-h-[300px] overflow-y-auto scrollbar-hide divide-y divide-white/5">
                            {exercises.map(ex => (
                                <div
                                    key={ex.id}
                                    onClick={() => setSelectedExerciseForDefaults(ex)}
                                    className="flex items-center justify-between p-4 hover:bg-slate-800 transition-colors cursor-pointer group"
                                >
                                    <div>
                                        <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{ex.name}</h4>
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{ex.category}</span>
                                    </div>
                                    <button className="text-xs font-bold text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-white/5 group-hover:text-white group-hover:border-slate-500 transition-colors">
                                        Configure
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Section>

            {showCreateModal && (
                <CreateWorkoutModal
                    onClose={() => setShowCreateModal(false)}
                    onWorkoutCreated={handleWorkoutCreated}
                />
            )}

            {workoutToSchedule && (
                <ScheduleWorkoutModal
                    workout={workoutToSchedule}
                    onClose={() => setWorkoutToSchedule(null)}
                    onScheduled={handleScheduleComplete}
                />
            )}

            {selectedExerciseForDefaults && (
                <ExerciseDefaultsModal
                    exercise={selectedExerciseForDefaults}
                    onClose={() => setSelectedExerciseForDefaults(null)}
                />
            )}
        </div>
    );
};

export default Plan;
