import React, { useState } from 'react';
import { X, Loader2, Dumbbell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const CreateWorkoutModal = ({ onClose, onWorkoutCreated }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('Strength');
    const [duration, setDuration] = useState(45);
    const [difficulty, setDifficulty] = useState('Intermediate');
    const [exercisesText, setExercisesText] = useState(''); // Simple text area for now

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 0. Ensure Profile Exists (Self-healing for legacy users)
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                    updated_at: new Date()
                }, { onConflict: 'id' });

            if (profileError) console.warn("Profile upsert warning:", profileError);

            // 1. Insert Workout
            const { data: workout, error } = await supabase
                .from('workouts')
                .insert({
                    user_id: user.id,
                    title,
                    description,
                    type,
                    duration_minutes: duration,
                    difficulty
                })
                .select()
                .single();

            if (error) throw error;

            // 2. Handle Exercises (Simple Text Parser)
            const lines = exercisesText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

            if (lines.length > 0) {
                // Determine exercise IDs (Find or Create)
                const exercisePromises = lines.map(async (line, index) => {
                    // Try to find existing
                    const { data: existing } = await supabase
                        .from('exercises')
                        .select('id')
                        .ilike('name', line)
                        .maybeSingle();

                    let exerciseId = existing?.id;

                    if (!exerciseId) {
                        // Create new exercise
                        const { data: newExercise } = await supabase
                            .from('exercises')
                            .insert({ name: line, category: 'Other' })
                            .select('id')
                            .single();
                        exerciseId = newExercise.id;
                    }

                    return {
                        workout_id: workout.id,
                        exercise_id: exerciseId,
                        order_index: index,
                        target_sets: 3, // Default
                        target_reps: 10, // Default
                        rest_seconds: 60 // Default
                    };
                });

                const workoutExercises = await Promise.all(exercisePromises);

                // Bulk Insert Link Table
                const { error: linkError } = await supabase
                    .from('workout_exercises')
                    .insert(workoutExercises);

                if (linkError) throw linkError;
            }

            onWorkoutCreated(workout);
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error creating workout: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Dumbbell size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">New Workout</h2>
                        <p className="text-xs text-slate-400">Create a template for your routine.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
                            placeholder="e.g. Leg Day Destruction"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Type</label>
                            <select
                                value={type}
                                onChange={e => setType(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
                            >
                                <option value="Strength">Strength</option>
                                <option value="Cardio">Cardio</option>
                                <option value="HIIT">HIIT</option>
                                <option value="Mobility">Mobility</option>
                                <option value="Recovery">Recovery</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Duration (min)</label>
                            <input
                                type="number"
                                value={duration}
                                onChange={e => setDuration(parseInt(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Difficulty</label>
                        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                            {['Beginner', 'Intermediate', 'Advanced'].map(l => (
                                <button
                                    key={l}
                                    type="button"
                                    onClick={() => setDifficulty(l)}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${difficulty === l ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Exercises (One per line)</label>
                        <textarea
                            value={exercisesText}
                            onChange={e => setExercisesText(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none h-32 resize-none text-sm font-mono"
                            placeholder="Squats&#10;Bench Press&#10;Deadlift"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none h-20 resize-none text-sm"
                            placeholder="Notes about this workout..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-4 rounded-xl mt-4 flex items-center justify-center transition-all active:scale-95"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Create Template'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateWorkoutModal;
