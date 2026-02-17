import React from 'react';
import clsx from 'clsx';

const WeekCalendar = () => {
    // Mock days for display
    const days = [
        { day: 'Mon', date: 12, status: 'complete' },
        { day: 'Tue', date: 13, status: 'active' },
        { day: 'Wed', date: 14, status: 'scheduled' },
        { day: 'Thu', date: 15, status: 'rest' },
        { day: 'Fri', date: 16, status: 'empty' },
        { day: 'Sat', date: 17, status: 'empty' },
        { day: 'Sun', date: 18, status: 'empty' },
    ];

    return (
        <div className="flex justify-between items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {days.map((d, i) => {
                const isActive = d.status === 'active';
                const isComplete = d.status === 'complete';
                const isScheduled = d.status === 'scheduled';
                const isRest = d.status === 'rest';

                return (
                    <div
                        key={i}
                        className={clsx(
                            "flex flex-col items-center justify-center min-w-[3.5rem] h-[5rem] rounded-2xl border transition-all cursor-pointer relative",
                            isActive
                                ? "bg-emerald-500 text-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105 z-10"
                                : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600"
                        )}
                    >
                        <span className={clsx("text-[10px] font-bold uppercase mb-1", isActive ? "text-emerald-900/70" : "text-slate-500")}>
                            {d.day}
                        </span>
                        <span className={clsx("text-lg font-bold", isActive ? "text-slate-900" : "text-white")}>
                            {d.date}
                        </span>

                        {/* Status Dot */}
                        <div className="mt-2">
                            {isComplete && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>}
                            {isScheduled && <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>}
                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-slate-900"></div>}
                            {isRest && <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default WeekCalendar;
