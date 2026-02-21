import React from 'react';
import { X, Clock, Dumbbell, Coffee } from 'lucide-react';

const DayScheduleModal = ({ date, scheduleItems, onClose }) => {

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="bg-slate-950 border-t sm:border border-white/5 sm:rounded-[24px] rounded-t-[24px] w-full max-w-[500px] max-h-[85vh] flex flex-col relative animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in duration-300 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="shrink-0 p-6 border-b border-white/5 flex justify-between items-start bg-slate-900/50">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-2">
                            {date.toLocaleDateString('en-US', { weekday: 'long' })}
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-900 border border-white/5 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-4">
                    {scheduleItems.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-slate-500 text-sm font-semibold">Nothing scheduled for today.</p>
                        </div>
                    ) : (
                        scheduleItems.map((item, idx) => (
                            <div key={item.id} className="bg-slate-900 rounded-[20px] p-5 border border-white/5">
                                {item.is_rest_day ? (
                                    <div className="flex flex-col items-center justify-center text-center py-4">
                                        <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 mb-3 border border-orange-500/20">
                                            <Coffee size={20} />
                                        </div>
                                        <h4 className="text-white font-bold text-md">Rest & Recovery</h4>
                                        <p className="text-xs text-slate-400 mt-1">Take this time to recharge.</p>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="text-emerald-400 font-bold text-lg leading-tight">
                                                {item.workouts?.title || "Workout"}
                                            </h4>
                                            {item.workouts?.duration_minutes && (
                                                <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-md border border-white/5 shrink-0">
                                                    <Clock size={10} />
                                                    {item.workouts.duration_minutes}m
                                                </div>
                                            )}
                                        </div>
                                        {item.workouts?.description && (
                                            <p className="text-xs text-slate-400 mb-4">{item.workouts.description}</p>
                                        )}
                                        {/* TODO: We could theoretically fetch exercises here, but a summary is fine for now */}
                                        <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                            <Dumbbell size={12} />
                                            Tap 'Plan' tab or Home Hero to start this session.
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default DayScheduleModal;
