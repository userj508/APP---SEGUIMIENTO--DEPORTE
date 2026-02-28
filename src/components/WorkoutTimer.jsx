import React from 'react';
import { Play, Pause, Square, SkipForward, Check } from 'lucide-react';
import clsx from 'clsx';

const WorkoutTimer = ({ isResting, restTime, targetReps, onAction, onAdjustTime }) => {
    // If we're resting, we show the countdown.
    // If working, we show the "Target Reps" + Finish Button

    // Circular Progress Calculation for Rest Time
    const maxRest = 60;
    const percentage = isResting ? ((maxRest - restTime) / maxRest) * 100 : 0;
    const strokeDashoffset = 440 - (440 * percentage) / 100; // 440 is roughly circumference of r=70

    return (
        <div className="relative flex flex-col items-center justify-center">
            {/* Main Interactive Circle */}
            <button
                onClick={onAction}
                className={clsx(
                    "w-64 h-64 rounded-full flex flex-col items-center justify-center relative transition-all duration-700 transform active:scale-[0.98] group outline-none",
                    isResting
                        ? "bg-sikan-cream shadow-[0_4px_40px_rgba(42,58,47,0.08)] border border-sikan-green/10" // Resting = Serene countdown
                        : "bg-sikan-cream shadow-[0_4px_30px_rgba(42,58,47,0.05)] border border-sikan-green/20 hover:border-sikan-green/40" // Working = Clean Target
                )}
            >
                {/* Custom SVG Progress Ring for Rest */}
                {isResting && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                        <circle
                            cx="128"
                            cy="128"
                            r="126"
                            stroke="CurrentColor"
                            strokeWidth="2"
                            fill="transparent"
                            className="text-sikan-gold/20"
                        />
                        <circle
                            cx="128"
                            cy="128"
                            r="126"
                            stroke="CurrentColor"
                            strokeWidth="3"
                            fill="transparent"
                            strokeDasharray="791" // 2 * pi * 126
                            strokeDashoffset={791 - (791 * percentage) / 100}
                            className="text-sikan-green transition-all duration-1000 ease-linear"
                            strokeLinecap="round"
                        />
                    </svg>
                )}

                {/* Content Inside Circle */}
                <div className="z-10 flex flex-col items-center">
                    {isResting ? (
                        <>
                            <span className="text-[10px] font-sans font-medium text-sikan-gold uppercase tracking-[0.2em] mb-2">Resting</span>
                            <span className="text-6xl font-serif font-medium text-sikan-green tabular-nums tracking-tighter">
                                {Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}
                            </span>
                            <div className="flex items-center gap-1.5 mt-4 text-sikan-green/60 text-[10px] font-sans font-semibold uppercase tracking-widest group-hover:text-sikan-green transition-colors">
                                <SkipForward size={12} strokeWidth={2} /> Skip Rest
                            </div>
                        </>
                    ) : (
                        <>
                            <span className="text-[10px] items-center flex flex-col font-sans font-medium text-sikan-gold uppercase tracking-[0.2em] mb-1">Target</span>
                            <span className="text-7xl font-serif font-medium text-sikan-green tracking-tighter mb-1 mt-2">
                                {targetReps}
                            </span>
                            <span className="text-sm font-serif italic text-sikan-green/70 mb-2">Reps</span>

                            <div className="absolute bottom-8 flex items-center justify-center w-full">
                                <div className="flex items-center gap-2 bg-sikan-green text-sikan-cream px-5 py-2.5 rounded-full shadow-md group-hover:bg-sikan-dark group-hover:scale-105 transition-all duration-300">
                                    <Check size={14} strokeWidth={2.5} className="text-sikan-cream" />
                                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest">Done</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </button>

            {/* Adjustment Buttons */}
            {isResting && (
                <div className="absolute -bottom-20 flex justify-center w-full gap-4">
                    <button onClick={(e) => { e.stopPropagation(); onAdjustTime(-15); }} className="w-12 h-12 flex items-center justify-center bg-sikan-cream border border-sikan-gold/30 rounded-full text-sikan-green text-[10px] font-sans font-bold hover:bg-sikan-gold/10 hover:border-sikan-gold transition-colors active:scale-95 shadow-sm">-15s</button>
                    <button onClick={(e) => { e.stopPropagation(); onAdjustTime(15); }} className="w-12 h-12 flex items-center justify-center bg-sikan-cream border border-sikan-gold/30 rounded-full text-sikan-green text-[10px] font-sans font-bold hover:bg-sikan-gold/10 hover:border-sikan-gold transition-colors active:scale-95 shadow-sm">+15s</button>
                </div>
            )}
        </div>
    );
};

export default WorkoutTimer;
