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
    const [activeGoals, setActiveGoals] = useState([]);
    const [selectedGoalId, setSelectedGoalId] = useState('');

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

    // Fetch Active Goals for Assignment
    useEffect(() => {
        if (!user) return;
        const fetchGoals = async () => {
            const { data } = await supabase
                .from('goals')
                .select('id, title')
                .eq('user_id', user.id)
                .eq('status', 'active');
            setActiveGoals(data || []);
        };
        fetchGoals();
    }, [user]);

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
                    difficulty,
                    goal_id: selectedGoalId || null
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

    const isCardio = type === 'Cardio';

    return (
        <div className="fixed inset-0 bg-sikan-dark/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-sikan-bg border border-sikan-border rounded-[28px] w-full max-w-lg p-7 relative animate-in fade-in zoom-in duration-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-sikan-card border border-sikan-border text-sikan-muted hover:text-sikan-dark transition-colors z-10 shadow-sm"
                >
                    <X size={16} />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-[18px] bg-[#EAE4DC] border border-sikan-border flex items-center justify-center text-sikan-olive shadow-inner">
                        <Dumbbell size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-serif font-bold text-sikan-dark tracking-tight">New Template</h2>
                        <p className="text-xs text-sikan-muted font-bold">Build a reusable session or sequence.</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-hide">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-5">
                            <div>
                                <label className="block text-[10px] font-bold text-sikan-muted tracking-widest uppercase mb-2">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-sikan-card border border-sikan-border rounded-[16px] px-5 py-4 text-sikan-dark focus:border-sikan-olive/30 focus:shadow-md outline-none font-bold text-sm transition-all"
                                    placeholder="e.g. Morning Yoga Flow"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-sikan-muted tracking-widest uppercase mb-2">Type</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {['Strength', 'Cardio', 'Yoga', 'Mindfulness', 'Nutrition'].map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setType(t)}
                                            className={`shrink-0 px-4 py-2 rounded-full border text-xs font-bold transition-all ${type === t ? 'bg-sikan-olive text-sikan-bg border-sikan-olive shadow-md' : 'bg-sikan-card text-sikan-muted border-sikan-border hover:border-sikan-olive/30'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {activeGoals.length > 0 && (
                            <div>
                                <label className="block text-[10px] font-bold text-sikan-muted tracking-widest uppercase mb-2">Assign to Target</label>
                                <select
                                    value={selectedGoalId}
                                    onChange={(e) => setSelectedGoalId(e.target.value)}
                                    className="w-full bg-sikan-card border border-sikan-border rounded-[16px] px-5 py-4 text-sm font-bold text-sikan-dark focus:border-[#896f5b]/30 focus:shadow-md outline-none transition-all appearance-none"
                                >
                                    <option value="">None / Do not assign</option>
                                    {activeGoals.map(g => (
                                        <option key={g.id} value={g.id}>{g.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}


                        {isCardio ? (
                            <div className="bg-sikan-olive/10 border border-sikan-olive/30 rounded-[16px] p-5 text-center">
                                <p className="text-sm font-bold text-sikan-dark">Cardio Session Template</p>
                                <p className="text-xs text-sikan-muted font-medium mt-1">This template won't require specific exercises. When you do it, you'll track time and optionally distance.</p>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-[10px] font-bold text-sikan-muted tracking-widest uppercase mb-2">Include Movements</label>

                                {/* Search Input */}
                                <div className="relative mb-4">
                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sikan-muted" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full bg-sikan-card border border-sikan-border rounded-[16px] pl-11 pr-5 py-4 text-sikan-dark font-bold focus:border-sikan-olive/30 focus:shadow-md outline-none text-sm transition-all"
                                        placeholder="Search exercises or poses..."
                                    />
                                    {searchQuery && searchResults.length === 0 && !isSearching && (
                                        <button
                                            type="button"
                                            onClick={createCustomExercise}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#EAE4DC] hover:bg-sikan-olive hover:text-sikan-bg text-[11px] font-bold px-3 py-1.5 rounded-lg border border-sikan-border transition-colors text-sikan-dark shadow-sm"
                                        >
                                            + Add custom
                                        </button>
                                    )}
                                </div>

                                {/* Search Results Dropdown */}
                                {searchResults.length > 0 && (
                                    <div className="bg-sikan-card rounded-[16px] border border-sikan-border overflow-hidden mb-4 shadow-xl">
                                        {searchResults.map((ex, index) => (
                                            <button
                                                key={ex.id}
                                                type="button"
                                                onClick={() => addExercise(ex)}
                                                className="w-full text-left px-5 py-3.5 hover:bg-[#EAE4DC] text-sm font-bold text-sikan-dark border-b border-sikan-border last:border-0 flex justify-between items-center group transition-colors"
                                            >
                                                <span>{ex.name}</span>
                                                <div className="w-6 h-6 rounded-full bg-sikan-bg group-hover:bg-sikan-olive flex items-center justify-center transition-colors border border-sikan-border group-hover:border-sikan-olive">
                                                    <Plus size={12} className="text-sikan-muted group-hover:text-sikan-bg" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Selected Exercises List */}
                                <div className="space-y-2 mt-4">
                                    {selectedExercises.map((ex, idx) => (
                                        <div key={ex.id} className="bg-sikan-card border border-sikan-border rounded-[16px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-[#EAE4DC] border border-sikan-border flex items-center justify-center text-[10px] font-bold text-sikan-olive shadow-inner">
                                                    {idx + 1}
                                                </div>
                                                <span className="text-sm font-bold text-sikan-dark">{ex.name}</span>
                                            </div>

                                            <div className="flex items-center gap-2 pl-9 md:pl-0">
                                                <div className="flex items-center gap-1.5 bg-sikan-bg rounded-xl px-2.5 py-1.5 border border-sikan-border">
                                                    <span className="text-[10px] font-bold text-sikan-muted uppercase tracking-widest">Sets</span>
                                                    <input
                                                        type="number"
                                                        value={ex.sets}
                                                        onChange={e => handleSetsRepsChange(ex.id, 'sets', e.target.value)}
                                                        className="w-8 bg-transparent text-center text-sm font-bold text-sikan-dark focus:outline-none"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-sikan-bg rounded-xl px-2.5 py-1.5 border border-sikan-border">
                                                    <span className="text-[10px] font-bold text-sikan-muted uppercase tracking-widest">Reps</span>
                                                    <input
                                                        type="number"
                                                        value={ex.reps}
                                                        onChange={e => handleSetsRepsChange(ex.id, 'reps', e.target.value)}
                                                        className="w-8 bg-transparent text-center text-sm font-bold text-sikan-dark focus:outline-none"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeExercise(ex.id)}
                                                    className="w-8 h-8 rounded-xl bg-sikan-bg border border-transparent hover:border-rose-500/30 flex items-center justify-center text-sikan-muted hover:text-rose-500 transition-colors ml-1 shadow-sm"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {selectedExercises.length === 0 && (
                                        <div className="text-center py-10 border border-dashed border-sikan-border bg-sikan-card rounded-[20px]">
                                            <p className="text-xs text-sikan-muted font-bold">Search to add movements.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || (!isCardio && selectedExercises.length === 0)}
                            className="w-full bg-sikan-olive hover:bg-sikan-dark disabled:opacity-50 disabled:bg-sikan-card disabled:text-sikan-muted text-sikan-bg font-bold text-sm py-4 rounded-[16px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-6 shadow-md"
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
