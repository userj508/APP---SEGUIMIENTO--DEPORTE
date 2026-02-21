import React, { useState, useEffect } from 'react';
import { X, Save, Dumbbell, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

const ExerciseDefaultsModal = ({ exercise, onClose }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [defaultWeight, setDefaultWeight] = useState('');
    const [defaultReps, setDefaultReps] = useState('');

    useEffect(() => {
        const fetchDefaults = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('user_exercise_defaults')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('exercise_id', exercise.id)
                    .maybeSingle();

                if (data) {
                    if (data.default_weight_kg) setDefaultWeight(data.default_weight_kg);
                    if (data.default_reps) setDefaultReps(data.default_reps);
                }
            } catch (err) {
                console.error("Error fetching defaults:", err);
            } finally {
                setLoading(false);
            }
        };

        if (user && exercise) {
            fetchDefaults();
        }
    }, [user, exercise]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                user_id: user.id,
                exercise_id: exercise.id,
                default_weight_kg: defaultWeight ? parseFloat(defaultWeight) : null,
                default_reps: defaultReps ? parseInt(defaultReps) : null,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('user_exercise_defaults')
                .upsert(payload, { onConflict: 'user_id, exercise_id' });

            if (error) throw error;
            onClose();
        } catch (err) {
            console.error("Error saving defaults:", err);
            alert("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-950 border border-white/5 rounded-[24px] w-full max-w-[400px] flex flex-col relative animate-in zoom-in-95 duration-300 shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-start bg-slate-900/50">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-2">
                            {exercise.category || "Exercise"}
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight">{exercise.name}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-900 border border-white/5 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-slate-400 mb-6">
                        Set your default goals for this exercise. Active workouts will auto-fill with these values.
                    </p>

                    {loading ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="animate-spin text-emerald-500" size={24} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                                    Default Weight (kg)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                        <Dumbbell size={16} />
                                    </div>
                                    <input
                                        type="number"
                                        step="0.5"
                                        placeholder="e.g. 60"
                                        value={defaultWeight}
                                        onChange={(e) => setDefaultWeight(e.target.value)}
                                        className="w-full bg-slate-900 text-white placeholder-slate-600 outline-none rounded-xl py-3 pl-10 pr-4 border border-white/5 focus:border-emerald-500/50 transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                                    Default Reps
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g. 10"
                                    value={defaultReps}
                                    onChange={(e) => setDefaultReps(e.target.value)}
                                    className="w-full bg-slate-900 text-white placeholder-slate-600 outline-none rounded-xl py-3 px-4 border border-white/5 focus:border-emerald-500/50 transition-colors"
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Save Defaults
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExerciseDefaultsModal;
