import React from 'react';
import { Clock, Dumbbell, Zap, Heart, Activity, MoreHorizontal, Play, CalendarPlus } from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

const WorkoutCard = ({ title, duration, type, level, onClick, onStart, onSchedule }) => {
    const navigate = useNavigate();

    const handleStart = (e) => {
        e.stopPropagation();
        e.preventDefault();

        // Execute callback if provided, else use default navigate behavior
        if (onStart) {
            onStart();
        }
    };

    const handleSchedule = (e) => {
        e.stopPropagation();
        e.preventDefault();

        if (onSchedule) {
            onSchedule();
        }
    };

    return (
        <div
            onClick={onClick}
            className="bg-slate-900 border border-white/5 rounded-[20px] p-5 hover:bg-slate-800/80 transition-all group flex flex-col cursor-pointer"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {type || 'Strength'}
                </div>
                <button className="text-slate-500 hover:text-white p-1 rounded-full transition-colors">
                    <MoreHorizontal size={18} />
                </button>
            </div>

            <div className="mb-6 flex-1">
                <h3 className="text-white font-bold text-lg mb-1.5 leading-tight">{title}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                    <span className="flex items-center">
                        <Clock size={12} className="mr-1.5 text-slate-500" />
                        {duration} min
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                    <span className="capitalize">{level}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-auto">
                <button
                    onClick={handleSchedule}
                    className="flex items-center justify-center gap-2 py-3 rounded-[14px] bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors border border-white/5"
                >
                    <CalendarPlus size={14} />
                    Schedule
                </button>
                <button
                    onClick={handleStart}
                    className="flex items-center justify-center gap-2 py-3 rounded-[14px] bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs font-bold transition-colors"
                >
                    <Play size={14} className="fill-current" />
                    Start
                </button>
            </div>
        </div>
    );
};

export default WorkoutCard;
