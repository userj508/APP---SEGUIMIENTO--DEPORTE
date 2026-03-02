import React, { useState } from 'react';
import { Clock, Dumbbell, Zap, Heart, Activity, MoreHorizontal, Play, CalendarPlus } from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

const WorkoutCard = ({ title, duration, type, level, onClick, onStart, onSchedule, onDelete }) => {
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);

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
            className="bg-sikan-card border border-sikan-border rounded-[20px] p-5 hover:shadow-md transition-all group flex flex-col cursor-pointer"
        >
            <div className="flex justify-between items-start mb-4 relative">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sikan-bg border border-sikan-border text-[10px] font-bold uppercase tracking-wider text-sikan-olive">
                    <span className="w-1.5 h-1.5 rounded-full bg-sikan-gold"></span>
                    {type || 'Strength'}
                </div>
                {onDelete && (
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            className="text-sikan-muted hover:text-sikan-dark p-1 rounded-full transition-colors"
                        >
                            <MoreHorizontal size={18} />
                        </button>
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}></div>
                                <div className="absolute right-0 top-full mt-1 w-32 bg-sikan-card border border-sikan-border rounded-xl shadow-lg z-50 overflow-hidden">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowMenu(false);
                                            onDelete();
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 transition-colors flex items-center gap-2"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
                {!onDelete && (
                    <button className="text-sikan-muted hover:text-sikan-dark p-1 rounded-full transition-colors cursor-default">
                        <MoreHorizontal size={18} />
                    </button>
                )}
            </div>

            <div className="mb-6 flex-1">
                <h3 className="text-sikan-dark font-serif font-bold text-lg mb-1.5 leading-tight">{title}</h3>
                <div className="flex items-center gap-3 text-xs text-sikan-muted font-bold tracking-wide">
                    <span className="flex items-center">
                        <Clock size={12} className="mr-1.5 text-sikan-olive" />
                        {duration} min
                    </span>
                    <span className="w-1 h-1 rounded-full bg-sikan-border"></span>
                    <span className="capitalize">{level}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-auto">
                <button
                    onClick={handleSchedule}
                    className="flex items-center justify-center gap-2 py-3 rounded-[14px] bg-sikan-bg border border-sikan-border hover:border-sikan-olive text-sikan-dark text-xs font-bold transition-colors"
                >
                    <CalendarPlus size={14} className="text-sikan-olive" />
                    Schedule
                </button>
                <button
                    onClick={handleStart}
                    className="flex items-center justify-center gap-2 py-3 rounded-[14px] bg-sikan-olive hover:bg-sikan-dark text-sikan-bg text-xs font-bold transition-colors shadow-sm"
                >
                    <Play size={14} className="fill-current text-sikan-gold" />
                    Start
                </button>
            </div>
        </div>
    );
};

export default WorkoutCard;
