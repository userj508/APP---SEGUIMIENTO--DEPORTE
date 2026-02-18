import React from 'react';
import { Clock, Dumbbell, Zap, Heart, Activity, MoreVertical, Play } from 'lucide-react';
import clsx from 'clsx';

const WorkoutCard = ({ title, duration, type, level, onClick, onStart, onSchedule }) => {
    // Color configuration based on workout type
    const typeConfig = {
        strength: {
            color: 'emerald',
            icon: Dumbbell,
            label: 'Strength',
            bg: 'bg-emerald-500/10',
            text: 'text-emerald-400',
            border: 'border-emerald-500/20'
        },
        cardio: {
            color: 'orange',
            icon: Heart,
            label: 'Cardio',
            bg: 'bg-orange-500/10',
            text: 'text-orange-400',
            border: 'border-orange-500/20'
        },
        hiit: {
            color: 'rose',
            icon: Zap,
            label: 'HIIT',
            bg: 'bg-rose-500/10',
            text: 'text-rose-400',
            border: 'border-rose-500/20'
        },
        mobility: {
            color: 'indigo',
            icon: Activity,
            label: 'Mobility',
            bg: 'bg-indigo-500/10',
            text: 'text-indigo-400',
            border: 'border-indigo-500/20'
        }
    };

    const config = typeConfig[type.toLowerCase()] || typeConfig.strength;
    const Icon = config.icon;

    return (
        <div
            onClick={onClick}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-all group relative overflow-hidden"
        >
            {/* Side accent bar */}
            <div className={clsx("absolute left-0 top-0 bottom-0 w-1", `bg-${config.color}-500`)}></div>

            <div className="flex justify-between items-start mb-3 pl-2">
                <div className={clsx("inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider", config.bg, config.text, "border", config.border)}>
                    <Icon size={10} className="mr-1" />
                    {config.label}
                </div>
                <button className="text-slate-600 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors">
                    <MoreVertical size={16} />
                </button>
            </div>

            <h3 className="text-white font-bold text-lg mb-1 pl-2 pr-8 truncate">{title}</h3>

            <div className="flex items-center gap-3 pl-2 mb-4 text-xs text-slate-500 font-medium">
                <span className="flex items-center">
                    <Clock size={12} className="mr-1" />
                    {duration} min
                </span>
                <span>•</span>
                <span className="capitalize">{level}</span>
            </div>

            <div className="pl-2 grid grid-cols-2 gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onSchedule && onSchedule();
                    }}
                    className="flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition-colors border border-slate-800 hover:border-slate-600 hover:text-white"
                >
                    <Clock size={14} />
                    Schedule
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onStart && onStart();
                    }}
                    className="flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-slate-900 text-xs font-bold transition-colors border border-emerald-500/20 hover:border-emerald-500"
                >
                    <Play size={14} className="fill-current" />
                    Start
                </button>
            </div>
        </div>
    );
};

export default WorkoutCard;
