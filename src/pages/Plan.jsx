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
        <div className="min-h-screen bg-sikan-bg text-sikan-dark px-5 pt-10 pb-28 font-sans selection:bg-sikan-gold/30">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <h2 className="text-xs font-semibold text-sikan-muted uppercase tracking-[0.2em] mb-1.5">Schedule</h2>
                    <h1 className="text-3xl font-serif font-bold tracking-tight text-sikan-dark">Plan & Build</h1>
                </div>
                <button className="w-10 h-10 rounded-full bg-sikan-card border border-sikan-border text-sikan-olive flex items-center justify-center hover:bg-[#EAE4DC] hover:text-sikan-dark transition-colors shadow-sm">
                    <SlidersHorizontal size={18} />
                </button>
            </header>

            {/* Weekly Calendar Component */}
            <WeeklyPlanner key={refreshTrigger} />

            {/* Core Actions */}
            <div className="grid grid-cols-2 gap-3 mb-10">
                <button className="flex flex-col items-start justify-center p-5 rounded-[20px] bg-sikan-card border border-sikan-border text-sikan-dark active:scale-[0.98] transition-all hover:shadow-md">
                    <div className="w-8 h-8 rounded-full bg-[#EAE4DC] text-sikan-olive flex items-center justify-center mb-3">
                        <Wand2 size={16} />
                    </div>
                    <span className="text-sm font-semibold">Generate Plan</span>
                    <span className="text-[10px] font-bold text-sikan-muted mt-0.5 uppercase tracking-wider">AI Powered</span>
                </button>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex flex-col items-start justify-center p-5 rounded-[20px] bg-sikan-card border border-sikan-border text-sikan-dark hover:shadow-md transition-all active:scale-[0.98]"
                >
                    <div className="w-8 h-8 rounded-full bg-sikan-bg border border-sikan-border flex items-center justify-center mb-3 text-sikan-olive">
                        <Plus size={16} />
                    </div>
                    <span className="text-sm font-semibold">Create Custom</span>
                    <span className="text-[10px] font-bold text-sikan-muted mt-0.5 uppercase tracking-wider">Manual Builder</span>
                </button>
            </div>

            {/* Saved Workouts */}
            <Section title="Library Workouts" action={<button className="text-xs text-sikan-olive hover:text-sikan-dark font-bold transition-colors uppercase tracking-wider">View All</button>}>
                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin tracking-tight text-sikan-olive" /></div>
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
                            className="rounded-[20px] flex flex-col items-center justify-center min-h-[160px] border border-dashed border-sikan-olive/30 hover:border-sikan-olive hover:bg-sikan-card transition-all text-sikan-muted hover:text-sikan-dark group"
                        >
                            <div className="w-10 h-10 rounded-full bg-[#EAE4DC] flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-sikan-olive group-hover:text-sikan-bg text-sikan-olive transition-all">
                                <Plus size={20} className="relative z-10" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">New Template</span>
                        </button>
                    </div>
                )}
            </Section>

            {/* Exercise Library */}
            <Section title="Exercise Configuration" action={<span className="text-xs text-sikan-muted font-bold uppercase tracking-wider">{exercises.length} Exercises</span>}>
                {loading ? (
                    <div className="flex justify-center py-6"><Loader2 className="animate-spin tracking-tight text-sikan-olive" /></div>
                ) : (
                    <div className="bg-sikan-card border border-sikan-border rounded-[24px] overflow-hidden shadow-sm">
                        <div className="max-h-[300px] overflow-y-auto scrollbar-hide divide-y divide-sikan-border">
                            {exercises.map(ex => (
                                <div
                                    key={ex.id}
                                    onClick={() => setSelectedExerciseForDefaults(ex)}
                                    className="flex items-center justify-between p-4 hover:bg-sikan-bg transition-colors cursor-pointer group"
                                >
                                    <div>
                                        <h4 className="text-sm font-bold text-sikan-dark group-hover:text-sikan-olive transition-colors">{ex.name}</h4>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sikan-muted">{ex.category}</span>
                                    </div>
                                    <button className="text-xs font-bold text-sikan-olive bg-sikan-bg px-3 py-1.5 rounded-lg border border-sikan-border group-hover:text-sikan-bg group-hover:bg-sikan-olive group-hover:border-sikan-olive transition-colors">
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

            {/* Delete Confirmation Modal */}
            {workoutToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-sikan-dark/40 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); setWorkoutToDelete(null); }}></div>
                    <div className="relative bg-sikan-card border border-sikan-border rounded-[24px] w-full max-w-sm p-6 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 z-10">
                        <div className="mb-6">
                            <h3 className="text-xl font-serif font-bold text-sikan-dark mb-2">Delete Workout?</h3>
                            <p className="text-sikan-muted text-sm font-sans">
                                Are you sure you want to delete <span className="text-sikan-olive font-bold">{workoutToDelete.title}</span>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={(e) => { e.stopPropagation(); setWorkoutToDelete(null); }}
                                className="py-3 px-4 rounded-xl font-bold text-sm bg-sikan-bg text-sikan-dark hover:bg-sikan-border transition-colors border border-sikan-border"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteWorkout(); }}
                                className="py-3 px-4 rounded-xl font-bold text-sm bg-rose-50 text-rose-500 border border-rose-200 hover:bg-rose-500 hover:text-white transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Plan;
