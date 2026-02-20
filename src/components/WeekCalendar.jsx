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
        const day = today.getDay() || 7;
        if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
        else startOfWeek.setHours(0, 0, 0, 0);

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
                    status = 'active';
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
        <div className="flex justify-between items-center gap-2 pb-2 overflow-x-auto scrollbar-hide w-full max-w-full">
            {days.map((d, i) => {
                const isActive = d.status === 'active'; // Today
                const isComplete = d.status === 'complete';
                const isScheduled = d.status === 'scheduled';

                // Active visuals means anything relevant happens today or is scheduled
                const isVisualActive = isActive || isScheduled || isComplete;

                return (
                    <div
                        key={i}
                        className={clsx(
                            "flex flex-col items-center justify-center flex-1 min-w-[40px] h-[72px] rounded-2xl border transition-all cursor-pointer relative",
                            isVisualActive
                                ? "bg-slate-900 border-white/5 hover:bg-slate-800"
                                : "bg-slate-950 border-white/5 text-slate-500 hover:bg-slate-900",
                            isActive && "border-slate-500 shadow-sm shadow-white/5 font-bold"
                        )}
                    >
                        <span className={clsx("text-[9px] font-bold uppercase mb-1 tracking-wider", isVisualActive ? "text-slate-400" : "text-slate-600")}>
                            {d.day}
                        </span>
                        <span className={clsx("text-base font-bold", isVisualActive ? "text-white" : "text-slate-600")}>
                            {d.date}
                        </span>

                        {/* Minimal Status Dot */}
                        <div className="mt-1.5 h-1 flex justify-center w-full relative">
                            {isComplete && <div className="absolute top-0 w-1 h-1 rounded-full bg-emerald-500"></div>}
                            {isScheduled && <div className="absolute top-0 w-1 h-1 rounded-full bg-slate-300"></div>}
                            {isActive && !isScheduled && !isComplete && <div className="absolute top-0 w-1 h-1 rounded-full bg-slate-600"></div>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default WeekCalendar;
