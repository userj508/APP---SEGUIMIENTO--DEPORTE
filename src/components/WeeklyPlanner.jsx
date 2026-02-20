import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Coffee, Clock, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const WeeklyPlanner = ({ onScheduleRequest }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [weekDates, setWeekDates] = useState([]);
    const [scheduleMap, setScheduleMap] = useState({}); // { '2023-11-01': [items] }
    const [loading, setLoading] = useState(true);

    // Timeline configuration
    const START_HOUR = 6;
    const END_HOUR = 22;
    const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

    useEffect(() => {
        // Generate current week dates centered or starting from today
        const today = new Date();
        const startOfWeek = new Date(today);
        const day = today.getDay() || 7;
        if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
        else startOfWeek.setHours(0, 0, 0, 0);

        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            dates.push(d);
        }
        setWeekDates(dates);
    }, []);

    const fetchSchedule = async () => {
        if (!user || weekDates.length === 0) return;
        setLoading(true);

        const startDateStr = weekDates[0].toISOString().split('T')[0];
        const endDateStr = weekDates[6].toISOString().split('T')[0];

        try {
            const { data, error } = await supabase
                .from('schedule')
                .select('*, workouts(*)')
                .eq('user_id', user.id)
                .gte('scheduled_date', startDateStr)
                .lte('scheduled_date', endDateStr);

            if (error) throw error;

            // Group by date
            const groupedMap = {};
            data?.forEach(item => {
                if (!groupedMap[item.scheduled_date]) {
                    groupedMap[item.scheduled_date] = {
                        is_rest_day: false,
                        items: []
                    };
                }
                if (item.is_rest_day) {
                    groupedMap[item.scheduled_date].is_rest_day = true;
                    // Keep the ID around so we can delete the rest day config if needed
                    groupedMap[item.scheduled_date].rest_day_id = item.id;
                } else if (item.workouts) {
                    groupedMap[item.scheduled_date].items.push(item);
                }
            });

            setScheduleMap(groupedMap);
        } catch (error) {
            console.error("Error fetching weekly schedule:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, [user, weekDates]);

    const handleToggleRestDay = async () => {
        const todayConfig = scheduleMap[selectedDate];
        const isCurrentlyRest = todayConfig?.is_rest_day;

        try {
            if (isCurrentlyRest) {
                // Remove rest day
                await supabase.from('schedule').delete().eq('id', todayConfig.rest_day_id);
            } else {
                // Set rest day - clear other things? Or just add the flag
                await supabase.from('schedule').insert({
                    user_id: user.id,
                    scheduled_date: selectedDate,
                    is_rest_day: true,
                    // Note: workout_id is NULL because of schema update
                });
            }
            await fetchSchedule();
        } catch (error) {
            console.error("Error toggling rest day:", error);
        }
    };

    const handleDeleteSchedule = async (id, e) => {
        e.stopPropagation();
        try {
            await supabase.from('schedule').delete().eq('id', id);
            await fetchSchedule();
        } catch (error) {
            console.error("Error deleting schedule:", error);
        }
    };

    const selectedConfig = scheduleMap[selectedDate] || { is_rest_day: false, items: [] };

    return (
        <div className="flex flex-col mb-8 gap-6 animate-in fade-in duration-300">
            {/* Horizontal Day Strip */}
            <div className="flex justify-between items-center gap-2 overflow-x-auto scrollbar-hide w-full max-w-full pb-2">
                {weekDates.map((d, i) => {
                    const dateStr = d.toISOString().split('T')[0];
                    const isSelected = selectedDate === dateStr;
                    const config = scheduleMap[dateStr];
                    const hasItems = config?.items?.length > 0;
                    const isRest = config?.is_rest_day;
                    const isToday = dateStr === new Date().toISOString().split('T')[0];

                    return (
                        <button
                            key={i}
                            onClick={() => setSelectedDate(dateStr)}
                            className={clsx(
                                "flex flex-col items-center justify-center flex-1 min-w-[48px] h-[80px] rounded-[20px] border transition-all relative overflow-hidden",
                                isSelected
                                    ? "bg-white border-white text-slate-950 shadow-lg shadow-white/10"
                                    : "bg-slate-900 border-white/5 text-slate-500 hover:bg-slate-800",
                                isToday && !isSelected && "border-slate-500"
                            )}
                        >
                            <span className={clsx("text-[10px] font-bold uppercase mb-1 tracking-wider", isSelected ? "text-slate-600" : "text-slate-500")}>
                                {d.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                            <span className={clsx("text-lg font-bold", isSelected ? "text-slate-950" : "text-slate-300")}>
                                {d.getDate()}
                            </span>

                            {/* Status Indicators */}
                            <div className="mt-1 h-1 flex justify-center gap-1 w-full relative">
                                {isRest && <div className={clsx("w-1.5 h-1.5 rounded-full", isSelected ? "bg-orange-500" : "bg-orange-500/50")}></div>}
                                {!isRest && hasItems && <div className={clsx("w-1.5 h-1.5 rounded-full", isSelected ? "bg-emerald-500" : "bg-emerald-500/50")}></div>}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Daily View Timeline */}
            <div className="bg-slate-900 border border-white/5 rounded-[24px] p-5 relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-lg text-white">Timeline</h3>
                        <p className="text-xs text-slate-400">
                            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <button
                        onClick={handleToggleRestDay}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-[14px] text-xs font-bold transition-all border",
                            selectedConfig.is_rest_day
                                ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                : "bg-slate-950 text-slate-400 border-white/5 hover:bg-slate-800"
                        )}
                    >
                        <Coffee size={14} />
                        {selectedConfig.is_rest_day ? "Resting" : "Rest Day"}
                    </button>
                </div>

                {selectedConfig.is_rest_day ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 mb-4 border border-orange-500/20 shadow-inner">
                            <Coffee size={24} />
                        </div>
                        <h4 className="text-white font-bold text-lg mb-1">Rest & Recovery</h4>
                        <p className="text-xs text-slate-400 max-w-[200px]">Take this time to recharge your muscles and mind.</p>
                    </div>
                ) : (
                    <div className="relative pl-14 min-h-[400px]">
                        {/* Hour Grid Lines */}
                        <div className="absolute inset-0 pl-14 flex flex-col pointer-events-none">
                            {hours.map(hour => (
                                <div key={hour} className="h-20 border-t border-white/5 w-full relative">
                                    <span className="absolute -left-12 -top-2.5 text-[10px] font-bold text-slate-500 w-10 text-right">
                                        {hour}:00
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Scheduled Items Overlay */}
                        <div className="absolute inset-0 pl-16 pt-[1px]">
                            {selectedConfig.items.map((item) => {
                                // Parse time, e.g. "18:00:00" or "18:00"
                                const timeStr = item.scheduled_time || "12:00:00";
                                const [hStr, mStr] = timeStr.split(':');
                                const startH = parseInt(hStr, 10);
                                const startM = parseInt(mStr, 10) || 0;

                                // If out of bounds, skip visual render
                                if (startH < START_HOUR || startH > END_HOUR) return null;

                                const topOffset = ((startH - START_HOUR) * 80) + ((startM / 60) * 80);
                                const durationMinutes = item.workouts?.duration_minutes || 45;
                                const heightPx = (durationMinutes / 60) * 80;

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => navigate(`/workout/${item.workouts?.id}`)}
                                        className="absolute left-16 right-4 rounded-[16px] bg-emerald-500/10 border border-emerald-500/20 p-3 hover:bg-emerald-500/20 transition-all cursor-pointer group flex flex-col"
                                        style={{
                                            top: `${topOffset}px`,
                                            height: `${heightPx}px`,
                                            minHeight: '40px' // Ensure visibility even if duration is 0
                                        }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-emerald-400 font-bold text-sm leading-tight group-hover:text-emerald-300 transition-colors">
                                                {item.workouts?.title}
                                            </h4>
                                            <button
                                                onClick={(e) => handleDeleteSchedule(item.id, e)}
                                                className="text-emerald-500/50 hover:text-rose-400 transition-colors bg-black/20 rounded-full p-1"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                        {heightPx >= 60 && (
                                            <div className="text-[10px] font-semibold text-emerald-500/70 flex items-center gap-1 mt-1">
                                                <Clock size={10} />
                                                {startH}:{startM === 0 ? '00' : startM} ({durationMinutes}m)
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Interactive invisible grid for clicking empty times */}
                        <div className="absolute inset-0 pl-14 flex flex-col z-0">
                            {hours.map(hour => (
                                <div
                                    key={hour}
                                    onClick={() => onScheduleRequest && onScheduleRequest(selectedDate, `${hour.toString().padStart(2, '0')}:00`)}
                                    className="h-20 w-full hover:bg-white/5 transition-colors cursor-crosshair"
                                >
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WeeklyPlanner;
