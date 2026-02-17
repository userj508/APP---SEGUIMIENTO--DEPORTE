import React from 'react';
import { Play, Pause, Square, SkipForward, Check } from 'lucide-react';
import clsx from 'clsx';

const WorkoutTimer = ({ isResting, restTime, targetReps, onAction, onAdjustTime }) => {
    // If we're resting, we show the countdown.
    // If working, we show the "Target Reps" + Finish Button

    // Circular Progress Calculation for Rest Time
    // Assuming max rest is 60s for now, or pass maxRest from parent
    const maxRest = 60;
    const percentage = isResting ? ((maxRest - restTime) / maxRest) * 100 : 0;
    const strokeDashoffset = 440 - (440 * percentage) / 100; // 440 is roughly circumference of r=70

    return (
        <div className="relative flex flex-col items-center justify-center">
            {/* Main Interactive Circle */}
            <button
                onClick={onAction}
                className={clsx(
                    "w-64 h-64 rounded-full flex flex-col items-center justify-center relative transition-all duration-500 transform active:scale-95 group outline-none",
                    isResting
                        ? "bg-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.4)] border-4 border-emerald-400" // Resting = Completed/Success State visually
                        : "bg-slate-800 border-4 border-slate-700 hover:border-slate-600 shadow-xl" // Working = Neutral State
                )}
            >
                {/* Custom SVG Progress Ring for Rest */}
                {isResting && (
                    <svg className="absolute top-0 left-0 w-full h-full -rotate-90 pointer-events-none">
                        <circle
                            cx="128"
                            cy="128"
                            r="124"
                            stroke="CurrentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-emerald-600/30"
                        />
                        <circle
                            cx="128"
                            cy="128"
                            r="124"
                            stroke="CurrentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray="780"
                            strokeDashoffset={strokeDashoffset}
                            className="text-white transition-all duration-1000 ease-linear"
                        />
                    </svg>
                )}

                {/* Content Inside Circle */}
                <div className="z-10 flex flex-col items-center">
                    {isResting ? (
                        <>
                            <span className="text-sm font-bold text-emerald-100 uppercase tracking-widest mb-1 animate-pulse">Resting</span>
                            <span className="text-7xl font-bold text-white tabular-nums tracking-tighter">
                                {Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}
                            </span>
                            <div className="flex items-center gap-1 mt-3 text-emerald-100/80 text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                                <SkipForward size={14} /> Tap to Skip
                            </div>
                        </>
                    ) : (
                        <>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Target</span>
                            <span className="text-7xl font-bold text-white tracking-tighter mb-1">
                                {targetReps}
                            </span>
                            <span className="text-lg font-bold text-slate-500 uppercase tracking-wide">Reps</span>
                            <div className="absolute bottom-10 flex items-center gap-2 bg-slate-700/50 px-4 py-1.5 rounded-full backdrop-blur-sm group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                                <Check size={16} className="text-slate-300 group-hover:text-white" />
                                <span className="text-xs font-bold text-slate-300 group-hover:text-white uppercase tracking-wide">Finish Set</span>
                            </div>
                        </>
                    )}
                </div>
            </button>

            {/* Adjustment Buttons */}
            {isResting && (
                <div className="absolute -bottom-16 flex gap-3">
                    <button onClick={(e) => { e.stopPropagation(); onAdjustTime(-10); }} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold hover:bg-slate-700 active:scale-95">-10s</button>
                    <button onClick={(e) => { e.stopPropagation(); onAdjustTime(10); }} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold hover:bg-slate-700 active:scale-95">+10s</button>
                </div>
            )}
        </div>
    );
};

export default WorkoutTimer;
