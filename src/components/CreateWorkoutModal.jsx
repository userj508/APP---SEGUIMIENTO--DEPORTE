import React, { useState, useEffect } from 'react';
import { X, Loader2, Dumbbell, Plus, Trash2, Search, ArrowRight } from 'lucide-react';
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
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                    updated_at: new Date()
                }, { onConflict: 'id' });

            if (profileError) console.warn("Profile upsert warning:", profileError);

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
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-950 border border-white/10 rounded-[28px] w-full max-w-lg p-7 relative animate-in fade-in zoom-in duration-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-900 border border-white/5 text-slate-400 hover:text-white transition-colors z-10"
                >
                    <X size={16} />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-[18px] bg-slate-900 border border-white/5 flex items-center justify-center text-slate-300">
                        <Dumbbell size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">New Template</h2>
                        <p className="text-xs text-slate-500 font-medium">Build a reusable session.</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-hide">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-5">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-2">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/5 rounded-[16px] px-5 py-4 text-white focus:border-white/20 focus:ring-1 focus:ring-white/20 outline-none text-sm transition-all"
                                    placeholder="e.g. Upper Body Push"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-2">Movements</label>

                            {/* Search Input */}
                            <div className="relative mb-4">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/5 rounded-[16px] pl-11 pr-5 py-4 text-white focus:border-white/20 focus:ring-1 focus:ring-white/20 outline-none text-sm transition-all"
                                    placeholder="Search exercises..."
                                />
                                {searchQuery && searchResults.length === 0 && !isSearching && (
                                    <button
                                        type="button"
                                        onClick={createCustomExercise}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-white/5 transition-colors text-white"
                                    >
                                        + Add custom
                                    </button>
                                )}
                            </div>

                            {/* Search Results Dropdown */}
                            {searchResults.length > 0 && (
                                <div className="bg-slate-800 rounded-[16px] border border-white/5 overflow-hidden mb-4 shadow-xl">
                                    {searchResults.map((ex, index) => (
                                        <button
                                            key={ex.id}
                                            type="button"
                                            onClick={() => addExercise(ex)}
                                            className="w-full text-left px-5 py-3.5 hover:bg-slate-700 text-sm font-medium text-slate-200 border-b border-white/5 last:border-0 flex justify-between items-center group transition-colors"
                                        >
                                            <span>{ex.name}</span>
                                            <div className="w-6 h-6 rounded-full bg-slate-900 group-hover:bg-slate-600 flex items-center justify-center transition-colors">
                                                <Plus size={12} className="text-slate-400 group-hover:text-white" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Selected Exercises List */}
                            <div className="space-y-2 mt-4">
                                {selectedExercises.map((ex, idx) => (
                                    <div key={ex.id} className="bg-slate-900 border border-white/5 rounded-[16px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-slate-950 border border-white/5 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                {idx + 1}
                                            </div>
                                            <span className="text-sm font-semibold text-white">{ex.name}</span>
                                        </div>

                                        <div className="flex items-center gap-2 pl-9 md:pl-0">
                                            <div className="flex items-center gap-1.5 bg-slate-950 rounded-xl px-2.5 py-1.5 border border-white/5">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sets</span>
                                                <input
                                                    type="number"
                                                    value={ex.sets}
                                                    onChange={e => handleSetsRepsChange(ex.id, 'sets', e.target.value)}
                                                    className="w-8 bg-transparent text-center text-sm font-bold text-white focus:outline-none"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-slate-950 rounded-xl px-2.5 py-1.5 border border-white/5">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reps</span>
                                                <input
                                                    type="number"
                                                    value={ex.reps}
                                                    onChange={e => handleSetsRepsChange(ex.id, 'reps', e.target.value)}
                                                    className="w-8 bg-transparent text-center text-sm font-bold text-white focus:outline-none"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeExercise(ex.id)}
                                                className="w-8 h-8 rounded-xl bg-slate-950 border border-transparent hover:border-rose-500/30 flex items-center justify-center text-slate-500 hover:text-rose-400 transition-colors ml-1"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {selectedExercises.length === 0 && (
                                    <div className="text-center py-10 border border-dashed border-white/10 rounded-[20px]">
                                        <p className="text-xs text-slate-500 font-medium">Search to add movements.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || selectedExercises.length === 0}
                            className="w-full bg-slate-100 hover:bg-white disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-sm py-4 rounded-[16px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-6"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <span>Create Template</span>}
                            {!loading && <ArrowRight size={16} />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateWorkoutModal;
