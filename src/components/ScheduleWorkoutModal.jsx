import React, { useState } from 'react';
import { X, Loader2, Calendar, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const ScheduleWorkoutModal = ({ workout, onClose, onScheduled }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState('18:00');

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
                    scheduled_time: selectedTime,
                    is_completed: false,
                    is_rest_day: false
                });

            if (error) throw error;

            onScheduled();
            onClose();
        } catch (error) {
            console.error("Error scheduling:", error);
            alert("Failed to schedule session.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-950 border border-white/5 rounded-[24px] w-full max-w-[360px] p-6 relative animate-in fade-in zoom-in duration-200 shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-900 border border-white/5 text-slate-400 hover:text-white transition-colors z-10"
                >
                    <X size={16} />
                </button>

                <div className="flex items-center gap-4 mb-8 pt-2">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-300">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">Schedule</h2>
                        <p className="text-xs text-slate-400 font-medium truncate max-w-[180px]">{workout.title}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 flex flex-col h-full">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">Select Date</span>
                        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
                            {weekDates.map((d) => {
                                const isSelected = selectedDate === d.dateStr;
                                return (
                                    <button
                                        key={d.dateStr}
                                        type="button"
                                        onClick={() => setSelectedDate(d.dateStr)}
                                        className={`flex flex-col items-center justify-center min-w-[50px] h-[72px] rounded-2xl border transition-all ${isSelected
                                            ? 'bg-white border-white text-slate-950 shadow-lg'
                                            : 'bg-slate-900 border-white/5 text-slate-500 hover:bg-slate-800'
                                            }`}
                                    >
                                        <span className={`text-[10px] font-bold uppercase mb-1 tracking-wider ${isSelected ? 'text-slate-600' : 'text-slate-500'}`}>{d.dayName}</span>
                                        <span className={`text-base font-bold ${isSelected ? 'text-slate-950' : 'text-slate-400'}`}>{d.dayNum}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">Time</span>
                        <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="time"
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                className="w-full bg-slate-900 border border-white/5 rounded-[16px] py-3.5 pl-11 pr-4 text-white text-sm font-semibold focus:outline-none focus:border-white/20 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-100 hover:bg-white text-slate-950 font-bold text-sm py-4 rounded-[16px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xl"
                    >
                        {loading ? <Loader2 className="animate-spin text-slate-950" size={18} /> : <span>Confirm Schedule</span>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ScheduleWorkoutModal;
