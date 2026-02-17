import React, { useState } from 'react';
import { X, Loader2, Calendar, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const ScheduleWorkoutModal = ({ workout, onClose, onScheduled }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default today

    // Generate next 7 days for quick selection
    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return {
            dateStr: d.toISOString().split('T')[0],
            dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNum: d.getDate()
        };
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('schedule')
                .insert({
                    user_id: user.id,
                    workout_id: workout.id,
                    scheduled_date: selectedDate,
                    is_completed: false
                });

            if (error) throw error;

            onScheduled();
            onClose();
        } catch (error) {
            console.error("Error scheduling:", error);
            alert("Failed to schedule workout.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Schedule Workout</h2>
                        <p className="text-xs text-slate-400 truncate max-w-[200px]">{workout.title}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Select Date</label>

                        {/* Quick Week Picker */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 mb-4">
                            {weekDates.map((d) => {
                                const isSelected = selectedDate === d.dateStr;
                                return (
                                    <button
                                        key={d.dateStr}
                                        type="button"
                                        onClick={() => setSelectedDate(d.dateStr)}
                                        className={`flex flex-col items-center justify-center min-w-[44px] h-[60px] rounded-xl border transition-all ${isSelected
                                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                                : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'
                                            }`}
                                    >
                                        <span className="text-[10px] font-bold uppercase mb-1">{d.dayName}</span>
                                        <span className="text-sm font-bold">{d.dayNum}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Manual Picker Fallback */}
                        <input
                            type="date"
                            required
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <><Check size={18} /> Confirm Schedule</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ScheduleWorkoutModal;
