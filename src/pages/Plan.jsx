import React, { useState, useEffect } from 'react';
import { Plus, SlidersHorizontal, Wand2, Loader2 } from 'lucide-react';
import WeekCalendar from '../components/WeekCalendar';
import WorkoutCard from '../components/WorkoutCard';
import Section from '../components/Section';
import CreateWorkoutModal from '../components/CreateWorkoutModal';
import ScheduleWorkoutModal from '../components/ScheduleWorkoutModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Plan = () => {
    const { user } = useAuth();
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [workoutToSchedule, setWorkoutToSchedule] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0); // Hack to force refresh calendar

    // Fetch Workouts
    useEffect(() => {
        if (!user) return;

        const fetchWorkouts = async () => {
            try {
                const { data, error } = await supabase
                    .from('workouts')
                    .select('*')
                    .or(`user_id.eq.${user.id},user_id.is.null`) // Own + System workouts
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setWorkouts(data || []);
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
        setRefreshTrigger(prev => prev + 1); // Refresh calendar
        alert("Workout Scheduled!");
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white px-5 pt-10 pb-28 relative">
            <header className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Your Schedule</h2>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Plan & Build</h1>
                </div>
                <button className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-colors">
                    <SlidersHorizontal size={18} />
                </button>
            </header>

            {/* Weekly Calendar */}
            <WeekCalendar key={refreshTrigger} />

            {/* AI Generation / Quick Add Actions */}
            <div className="grid grid-cols-2 gap-3 mb-8">
                <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">
                    <Wand2 size={24} className="mb-2 opacity-90" />
                    <span className="text-sm font-bold">Generate Week</span>
                    <span className="text-[10px] opacity-75 mt-0.5">AI Powered</span>
                </button>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors active:scale-95"
                >
                    <Plus size={24} className="mb-2 text-slate-500" />
                    <span className="text-sm font-bold">Create Custom</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Manual Builder</span>
                </button>
            </div>

            {/* Saved Workouts */}
            <Section title="Saved Workouts" action={<button className="text-sm text-emerald-500 font-bold">View All</button>}>
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-500" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {workouts.map(workout => (
                            <Link to={`/workout/${workout.id}`} key={workout.id}>
                                <WorkoutCard
                                    title={workout.title}
                                    duration={workout.duration_minutes}
                                    type={workout.type}
                                    level={workout.difficulty}
                                    onStart={() => {
                                        // Force navigation programmatically if button is clicked
                                        // The Link wrapper handles the card click, but button stops propagation
                                        window.location.href = `#/workout/${workout.id}`; // Fallback or use navigate hook if available
                                    }}
                                    onSchedule={() => setWorkoutToSchedule(workout)}
                                />
                            </Link>
                        ))}

                        {/* Add New Placeholder Card */}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="border-2 border-dashed border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[140px] hover:border-slate-700 hover:bg-slate-900/50 transition-all text-slate-600 hover:text-slate-400 group"
                        >
                            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Plus size={24} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wide">Save New Template</span>
                        </button>
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
        </div>
    );
};

export default Plan;
