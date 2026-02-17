import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const WeekCalendar = () => {
    const { user } = useAuth();
    const [days, setDays] = useState([]);

    useEffect(() => {
        // Generate current week dates
        const today = new Date();
        const startOfWeek = new Date(today);
        const day = today.getDay() || 7; // Get current day number, converting Sun (0) to 7
        if (day !== 1) startOfWeek.setHours(-24 * (day - 1)); // Adjust to Monday
        else startOfWeek.setHours(0, 0, 0, 0); // It is Monday

        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            weekDates.push(d);
        }

        const fetchSchedule = async () => {
            if (!user) return;

            const startDateStr = weekDates[0].toISOString().split('T')[0];
            const endDateStr = weekDates[6].toISOString().split('T')[0];

            const { data: scheduleData } = await supabase
                .from('schedule')
                .select('scheduled_date, is_completed')
                .eq('user_id', user.id)
                .gte('scheduled_date', startDateStr)
                .lte('scheduled_date', endDateStr);

            // Map Dates to Status
            const mappedDays = weekDates.map(d => {
                const dateStr = d.toISOString().split('T')[0];
                const isToday = dateStr === new Date().toISOString().split('T')[0];

                const scheduleItem = scheduleData?.find(s => s.scheduled_date === dateStr);

                let status = 'empty';
                if (scheduleItem) {
                    status = scheduleItem.is_completed ? 'complete' : 'scheduled';
                } else if (isToday) {
                    status = 'active'; // Just highlight today if nothing else
                }

                return {
                    day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                    date: d.getDate(),
                    fullDate: dateStr,
                    status
                };
            });

            setDays(mappedDays);
        };

        fetchSchedule();
    }, [user]);

    return (
        <div className="flex justify-between items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {days.map((d, i) => {
                const isActive = d.status === 'active'; // Today
                const isComplete = d.status === 'complete';
                const isScheduled = d.status === 'scheduled';
                const isRest = d.status === 'rest';

                // Helper to check if it's strictly "Active" visually (scale up)
                const isVisualActive = isActive || isScheduled || isComplete;

                return (
                    <div
                        key={i}
                        className={clsx(
                            "flex flex-col items-center justify-center min-w-[3.5rem] h-[5rem] rounded-2xl border transition-all cursor-pointer relative",
                            isVisualActive
                                ? "bg-slate-900 border-slate-700 hover:border-emerald-500/50"
                                : "bg-slate-900/50 border-slate-800 text-slate-500",
                            isActive && "border-emerald-500 shadow-lg shadow-emerald-500/10"
                        )}
                    >
                        <span className={clsx("text-[10px] font-bold uppercase mb-1", isVisualActive ? "text-slate-400" : "text-slate-600")}>
                            {d.day}
                        </span>
                        <span className={clsx("text-lg font-bold", isVisualActive ? "text-white" : "text-slate-500")}>
                            {d.date}
                        </span>

                        {/* Status Dot */}
                        <div className="mt-2 h-1.5 flex justify-center">
                            {isComplete && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>}
                            {isScheduled && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                            {isActive && !isScheduled && !isComplete && <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default WeekCalendar;
