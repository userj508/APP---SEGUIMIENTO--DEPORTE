import React, { useMemo } from 'react';
import { X, Clock, Dumbbell, Apple, Flower2, Calendar } from 'lucide-react';

const CategoryScheduleModal = ({ category, weekSchedule, onClose }) => {
    // Filter the week schedule based on the chosen category
    const filteredItems = useMemo(() => {
        return weekSchedule.filter(item => {
            if (item.is_rest_day) return false; // Skip pure rest days for these specific lists
            const type = item.workouts?.type || 'Strength';
            if (category === 'Training') return type === 'Strength' || type === 'Cardio';
            if (category === 'Nutrition') return type === 'Nutrition';
            if (category === 'Mindfulness') return type === 'Yoga' || type === 'Mindfulness';
            return false;
        }).sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
    }, [category, weekSchedule]);

    const getCategoryConfig = () => {
        switch (category) {
            case 'Training': return {
                icon: <Dumbbell size={20} />,
                color: 'text-sikan-olive',
                bg: 'bg-[#EAE4DC]',
                title: 'Training Schedule',
                desc: 'Your active sessions structured for this week.'
            };
            case 'Nutrition': return {
                icon: <Apple size={20} />,
                color: 'text-sikan-dark',
                bg: 'bg-sikan-olive',
                title: 'Meal Plan',
                desc: 'Your scheduled nutrition and meal preps.'
            };
            case 'Mindfulness': return {
                icon: <Flower2 size={20} />,
                color: 'text-[#A47146]',
                bg: 'bg-[#E3C7A1]',
                title: 'Mind & Body',
                desc: 'Yoga and mindfulness recovery sessions.'
            };
            default: return { icon: <Calendar />, color: 'text-sikan-dark', bg: 'bg-[#EAE4DC]', title: 'Schedule', desc: '' };
        }
    };

    const config = getCategoryConfig();

    return (
        <div className="fixed inset-0 bg-sikan-dark/40 backdrop-blur-md z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="bg-sikan-bg border-t sm:border border-sikan-border sm:rounded-[24px] rounded-t-[24px] w-full max-w-[500px] max-h-[85vh] flex flex-col relative animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in duration-300 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="shrink-0 p-6 border-b border-sikan-border flex justify-between items-start bg-sikan-card z-10 shadow-sm">
                    <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center ${config.bg} ${config.color} shadow-inner`}>
                            {config.icon}
                        </div>
                        <div>
                            <h2 className="text-xl font-serif font-bold text-sikan-dark tracking-tight">
                                {config.title}
                            </h2>
                            <p className="text-xs font-bold text-sikan-muted mt-0.5">{config.desc}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-sikan-bg border border-sikan-border text-sikan-muted hover:text-sikan-dark transition-colors shadow-sm"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* List Body */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-4 bg-sikan-bg">
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-12 bg-sikan-card rounded-[20px] border border-dashed border-sikan-border">
                            <p className="text-sikan-muted text-sm font-bold">Nothing found for {category} this week.</p>
                            <p className="text-xs text-sikan-muted font-medium mt-1">Tap the Plan tab to schedule some.</p>
                        </div>
                    ) : (
                        filteredItems.map((item, idx) => {
                            const dateObj = new Date(item.scheduled_date + 'T12:00:00Z');
                            const isToday = new Date().toISOString().split('T')[0] === item.scheduled_date;

                            return (
                                <div key={item.id} className="bg-sikan-card rounded-[20px] p-5 border border-sikan-border shadow-sm flex items-center gap-4 group hover:border-sikan-olive/30 transition-colors">
                                    {/* Date Badge */}
                                    <div className={`shrink-0 w-16 h-16 rounded-[16px] flex flex-col items-center justify-center border ${isToday ? 'bg-sikan-olive border-sikan-olive text-sikan-bg shadow-md transform scale-105' : 'bg-sikan-bg border-sikan-border text-sikan-dark'}`}>
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{dateObj.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                        <span className="text-xl font-serif font-bold leading-none mt-1">{dateObj.getDate()}</span>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`font-bold text-md leading-tight truncate ${item.is_completed ? 'text-sikan-muted line-through' : 'text-sikan-dark'}`}>
                                                {item.workouts?.title || "Session"}
                                            </h4>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-sikan-muted mt-1">
                                            {item.workouts?.duration_minutes && (
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <Clock size={12} className="text-sikan-olive" />
                                                    {item.workouts.duration_minutes}m
                                                </div>
                                            )}
                                            <span className="w-1 h-1 rounded-full bg-sikan-border shrink-0"></span>
                                            <span className="uppercase tracking-wider text-[10px] truncate">{item.workouts?.type || category}</span>
                                        </div>
                                    </div>

                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default CategoryScheduleModal;
