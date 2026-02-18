import React, { useState, useEffect } from 'react';
import { X, Loader2, Dumbbell, Plus, Trash2, Search } from 'lucide-react';
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

    // Exercise Selection State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedExercises, setSelectedExercises] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Search Exercises
    useEffect(() => {
        const searchExercises = async () => {
            if (searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const { data } = await supabase
                    .from('exercises')
                    .select('*')
                    .ilike('name', `%${searchQuery}%`)
                    .limit(5);
                setSearchResults(data || []);
            } catch (error) {
                console.error("Error searching exercises:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(searchExercises, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const addExercise = (exercise) => {
        if (!selectedExercises.some(e => e.id === exercise.id)) {
            setSelectedExercises([...selectedExercises, { ...exercise, sets: 3, reps: 10 }]);
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeExercise = (exerciseId) => {
        setSelectedExercises(selectedExercises.filter(e => e.id !== exerciseId));
    };

    const handleSetsRepsChange = (exerciseId, field, value) => {
        setSelectedExercises(selectedExercises.map(e =>
            e.id === exerciseId ? { ...e, [field]: value } : e
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 0. Ensure Profile Exists
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

            // 2. Insert Selected Exercises
            if (selectedExercises.length > 0) {
                const workoutExercises = selectedExercises.map((ex, index) => ({
                    workout_id: workout.id,
                    exercise_id: ex.id,
                    order_index: index,
                    target_sets: parseInt(ex.sets) || 3,
                    target_reps: parseInt(ex.reps) || 10,
                    rest_seconds: 60
                }));

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

    // Quick add custom exercise if not found
    const createCustomExercise = async () => {
        if (!searchQuery) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('exercises')
                .insert({ name: searchQuery, category: 'Custom' })
                .select()
                .single();

            if (error) throw error;
            addExercise(data);
        } catch (error) {
            console.error("Error creating custom exercise:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
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
                        <p className="text-xs text-slate-400">Build your custom routine.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none text-sm"
                                placeholder="e.g. Upper Body Power"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Type</label>
                            <select
                                value={type}
                                onChange={e => setType(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none text-sm"
                            >
                                <option value="Strength">Strength</option>
                                <option value="Cardio">Cardio</option>
                                <option value="HIIT">HIIT</option>
                                <option value="Mobility">Mobility</option>
                            </select>
                        </div>
                    </div>

                    {/* Exercise Selector */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Build Routine</label>

                        {/* Search Input */}
                        <div className="relative mb-3">
                            <Search size={16} className="absolute left-3 top-3 text-slate-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-emerald-500 outline-none text-sm"
                                placeholder="Search exercises (e.g. Bench Press)..."
                            />
                            {searchQuery && searchResults.length === 0 && !isSearching && (
                                <button
                                    type="button"
                                    onClick={createCustomExercise}
                                    className="absolute right-2 top-2 bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-lg transition-colors border border-slate-700"
                                >
                                    + Add Custom
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-3 max-h-40 overflow-y-auto">
                                {searchResults.map(ex => (
                                    <button
                                        key={ex.id}
                                        type="button"
                                        onClick={() => addExercise(ex)}
                                        className="w-full text-left px-4 py-2 hover:bg-slate-700 text-sm text-slate-200 border-b border-slate-700/50 last:border-0 flex justify-between items-center group"
                                    >
                                        <span>{ex.name}</span>
                                        <Plus size={14} className="opacity-0 group-hover:opacity-100 text-emerald-500" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Selected Exercises List */}
                        <div className="space-y-2">
                            {selectedExercises.map((ex, idx) => (
                                <div key={ex.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between group">
                                    <div>
                                        <span className="text-xs text-slate-500 font-bold mr-2">#{idx + 1}</span>
                                        <span className="text-sm font-medium text-slate-200">{ex.name}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 bg-slate-900 rounded-lg px-2 py-1 border border-slate-800">
                                            <span className="text-[10px] text-slate-500 uppercase">Sets</span>
                                            <input
                                                type="number"
                                                value={ex.sets}
                                                onChange={e => handleSetsRepsChange(ex.id, 'sets', e.target.value)}
                                                className="w-8 bg-transparent text-center text-xs font-bold focus:outline-none"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1 bg-slate-900 rounded-lg px-2 py-1 border border-slate-800">
                                            <span className="text-[10px] text-slate-500 uppercase">Reps</span>
                                            <input
                                                type="number"
                                                value={ex.reps}
                                                onChange={e => handleSetsRepsChange(ex.id, 'reps', e.target.value)}
                                                className="w-8 bg-transparent text-center text-xs font-bold focus:outline-none"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeExercise(ex.id)}
                                            className="text-slate-600 hover:text-rose-500 p-1.5 hover:bg-rose-500/10 rounded-lg transition-colors ml-1"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {selectedExercises.length === 0 && (
                                <div className="text-center py-6 border-2 border-dashed border-slate-800 rounded-xl">
                                    <p className="text-xs text-slate-500">No exercises added yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || selectedExercises.length === 0}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-4 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : `Save Workout (${selectedExercises.length} Exercises)`}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateWorkoutModal;
