import React, { useState } from 'react';
import { X, Loader2, Calendar, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const ScheduleWorkoutModal = ({ workout, onClose, onScheduled }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState('18:00');
    const [recurrenceWeeks, setRecurrenceWeeks] = useState(1);

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
            const schedulesToInsert = [];
            const baseDate = new Date(selectedDate);

            for (let i = 0; i < recurrenceWeeks; i++) {
                const scheduleDate = new Date(baseDate);
                scheduleDate.setDate(baseDate.getDate() + (i * 7));

                schedulesToInsert.push({
                    user_id: user.id,
                    workout_id: workout.id,
                    scheduled_date: scheduleDate.toISOString().split('T')[0],
                    scheduled_time: selectedTime,
                    is_completed: false,
                    is_rest_day: false
                });
            }

            const { error } = await supabase
                .from('schedule')
                .insert(schedulesToInsert);

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

                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">Recurrence</span>
                        <select
                            value={recurrenceWeeks}
                            onChange={(e) => setRecurrenceWeeks(parseInt(e.target.value))}
                            className="w-full bg-slate-900 border border-white/5 rounded-[16px] py-3.5 px-4 text-white text-sm font-semibold focus:outline-none focus:border-white/20 transition-colors appearance-none"
                            style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px top 50%', backgroundSize: '12px auto' }}
                        >
                            <option value={1}>Only once</option>
                            <option value={2}>Every week for 2 weeks</option>
                            <option value={3}>Every week for 3 weeks</option>
                            <option value={4}>Every week for 4 weeks</option>
                            <option value={8}>Every week for 8 weeks</option>
                            <option value={12}>Every week for 12 weeks</option>
                        </select>
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
