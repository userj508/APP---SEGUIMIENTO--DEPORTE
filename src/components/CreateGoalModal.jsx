import React, { useState } from 'react';
import { Target, X, PlusCircle, AlignLeft, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const CreateGoalModal = ({ onClose, onGoalCreated }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [metric, setMetric] = useState('sessions');
    const [targetValue, setTargetValue] = useState('');
    const [deadline, setDeadline] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!title.trim() || !targetValue || isNaN(targetValue) || parseFloat(targetValue) <= 0) {
            setError('Please enter a valid title and target number.');
            return;
        }

        setIsSubmitting(true);
        try {
            const newGoal = {
                user_id: user.id,
                title: title.trim(),
                target_metric: metric,
                target_value: parseFloat(targetValue),
                deadline: deadline || null,
                status: 'active'
            };

            const { data, error: insertError } = await supabase
                .from('goals')
                .insert([newGoal])
                .select()
                .single();

            if (insertError) throw insertError;

            if (onGoalCreated) {
                onGoalCreated(data);
            }
            onClose();
        } catch (err) {
            console.error("Error creating goal:", err);
            setError(err.message || 'Error creating goal. Try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col pt-10" onClick={onClose}>
            {/* Dark overlay backdrop */}
            <div className="absolute inset-0 bg-sikan-dark/40 backdrop-blur-sm -z-10 animate-fade-in" />

            <div className="bg-sikan-cream w-full h-full p-6 pt-12 flex flex-col animate-slide-up rounded-t-[40px] shadow-2xl relative" onClick={e => e.stopPropagation()}>
                {/* Drag handle pill */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-sikan-border rounded-full" />
                
                <button onClick={onClose} className="absolute top-6 right-6 text-sikan-muted hover:text-sikan-dark transition-colors bg-[#EAE4DC] p-2 rounded-full">
                    <X size={20} />
                </button>

                <div className="mb-8">
                    <div className="w-12 h-12 bg-[#FAF8F5] rounded-full flex items-center justify-center border border-sikan-border mb-4 shadow-sm">
                        <Target size={24} className="text-sikan-dark" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-sikan-dark tracking-tight">Set a New Goal</h2>
                    <p className="text-sm font-semibold text-sikan-muted mt-1">Define your target to track your progress automatically.</p>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 pb-10">
                    <div className="flex-1 overflow-y-auto px-1 space-y-6 scrollbar-hide pb-20">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-[11px] font-bold border border-red-100 flex items-center shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-2 shrink-0"></span>
                                {error}
                            </div>
                        )}

                        {/* Title */}
                        <div>
                            <label className="flex items-center gap-2 text-[10px] font-bold text-sikan-muted uppercase tracking-widest mb-2 ml-1">
                                <AlignLeft size={12} />
                                Goal Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Run 100km, Bulking Phase..."
                                className="w-full bg-[#FAF8F5] border border-sikan-border rounded-[16px] px-4 py-8 text-sikan-dark text-lg font-bold placeholder:font-medium placeholder:text-sikan-muted/50 focus:outline-none focus:border-sikan-olive focus:ring-1 focus:ring-sikan-olive transition-all shadow-inner"
                                required
                            />
                        </div>

                        {/* Dropdown Metric Type */}
                        <div>
                            <label className="block text-[10px] font-bold text-sikan-muted uppercase tracking-widest mb-2 ml-1">
                                Target Metric
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button type="button" onClick={() => setMetric('sessions')} className={`px-2 py-4 rounded-[16px] border text-xs font-bold transition-all shadow-sm ${metric === 'sessions' ? 'bg-sikan-olive border-sikan-olive text-[#EAE4DC] ring-2 ring-sikan-olive/20 ring-offset-2 ring-offset-sikan-cream scale-[1.02]' : 'bg-[#FAF8F5] border-sikan-border text-sikan-muted hover:border-sikan-muted/30 hover:bg-white'}`}>
                                    Total<br/>Sessions
                                </button>
                                <button type="button" onClick={() => setMetric('distance_km')} className={`px-2 py-4 rounded-[16px] border text-xs font-bold transition-all shadow-sm ${metric === 'distance_km' ? 'bg-[#4A7243] border-[#4A7243] text-[#EAE4DC] ring-2 ring-[#4A7243]/20 ring-offset-2 ring-offset-sikan-cream scale-[1.02]' : 'bg-[#FAF8F5] border-sikan-border text-sikan-muted hover:border-sikan-muted/30 hover:bg-white'}`}>
                                    Distance<br/>(km)
                                </button>
                                <button type="button" onClick={() => setMetric('volume_kg')} className={`px-2 py-4 rounded-[16px] border text-xs font-bold transition-all shadow-sm ${metric === 'volume_kg' ? 'bg-[#896f5b] border-[#896f5b] text-[#EAE4DC] ring-2 ring-[#896f5b]/20 ring-offset-2 ring-offset-sikan-cream scale-[1.02]' : 'bg-[#FAF8F5] border-sikan-border text-sikan-muted hover:border-sikan-muted/30 hover:bg-white'}`}>
                                    Lift Volume<br/>(kg)
                                </button>
                            </div>
                        </div>

                        {/* Number & Deadline Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-sikan-muted uppercase tracking-widest mb-2 ml-1">
                                    Target Number
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={targetValue}
                                    onChange={(e) => setTargetValue(e.target.value)}
                                    placeholder={metric === 'distance_km' ? "100" : metric === 'sessions' ? "20" : '5000'}
                                    className="w-full bg-[#FAF8F5] border border-sikan-border rounded-[16px] px-4 py-8 text-sikan-dark text-center text-3xl font-serif font-bold placeholder:font-medium placeholder:text-sikan-muted/30 focus:outline-none focus:border-sikan-olive focus:ring-1 focus:ring-sikan-olive transition-all shadow-inner"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-sikan-muted uppercase tracking-widest mb-2 ml-1">
                                    Deadline (Optional)
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                        className="w-full bg-white border border-sikan-border rounded-[16px] px-4 py-4 h-[98px] text-sikan-dark font-bold focus:outline-none focus:border-sikan-olive focus:ring-1 focus:ring-sikan-olive transition-all shadow-sm uppercase tracking-wider text-xs"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                        <Calendar size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <p className="text-[10px] text-center text-sikan-muted font-bold px-4 py-2 border border-dashed border-sikan-border rounded-xl">
                            {metric === 'distance_km' && "All logged runs and swims will automatically add up to this target."}
                            {metric === 'sessions' && "You can assign specific planned workouts to advance this target."}
                            {metric === 'volume_kg' && "Volume lifted during assigned workouts will contribute here."}
                        </p>
                    </div>

                    <div className="pt-4 border-t border-sikan-border mt-auto bg-sikan-cream absolute bottom-0 left-0 right-0 p-6 shadow-[0_-10px_40px_rgba(244,241,234,0.9)]">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-sikan-dark text-sikan-cream font-bold py-4.5 rounded-[16px] shadow-lg flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <PlusCircle size={20} className="mr-2 opacity-80" />
                                    Save Goal
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGoalModal;
