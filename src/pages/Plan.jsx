import React, { useState } from 'react';
import { Plus, SlidersHorizontal, Wand2 } from 'lucide-react';
import WeekCalendar from '../components/WeekCalendar';
import WorkoutCard from '../components/WorkoutCard';
import Section from '../components/Section';

const Plan = () => {
    // Mock saved workouts
    const [savedWorkouts] = useState([
        { id: 1, title: 'Upper Body Power', duration: 45, type: 'Strength', level: 'Advanced' },
        { id: 2, title: 'HIIT Cardio Blast', duration: 25, type: 'HIIT', level: 'Intermediate' },
        { id: 3, title: 'Full Body Mobility', duration: 20, type: 'Mobility', level: 'Beginner' },
        { id: 4, title: 'Leg Day Crusher', duration: 55, type: 'Strength', level: 'Advanced' },
        { id: 5, title: 'Zone 2 Run', duration: 40, type: 'Cardio', level: 'All Levels' },
    ]);

    return (
        <div className="min-h-screen bg-slate-950 text-white px-5 pt-10 pb-28">
            <header className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Your Schedule</h2>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Plan & Build</h1>
                </div>
                <button className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-colors">
                    <SlidersHorizontal size={18} />
                </button>
            </header>

            {/* Weekly Calendar */}
            <WeekCalendar />

            {/* AI Generation / Quick Add Actions */}
            <div className="grid grid-cols-2 gap-3 mb-8">
                <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">
                    <Wand2 size={24} className="mb-2 opacity-90" />
                    <span className="text-sm font-bold">Generate Week</span>
                    <span className="text-[10px] opacity-75 mt-0.5">AI Powered</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors">
                    <Plus size={24} className="mb-2 text-slate-500" />
                    <span className="text-sm font-bold">Create Custom</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Manual Builder</span>
                </button>
            </div>

            {/* Saved Workouts */}
            <Section title="Saved Workouts" action={<button className="text-sm text-emerald-500 font-bold">View All</button>}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedWorkouts.map(workout => (
                        <WorkoutCard
                            key={workout.id}
                            title={workout.title}
                            duration={workout.duration}
                            type={workout.type}
                            level={workout.level}
                            onStart={() => console.log('Start workout', workout.id)}
                        />
                    ))}

                    {/* Add New Placeolder Card */}
                    <button className="border-2 border-dashed border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[140px] hover:border-slate-700 hover:bg-slate-900/50 transition-all text-slate-600 hover:text-slate-400 group">
                        <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Plus size={24} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wide">Save New Template</span>
                    </button>
                </div>
            </Section>
        </div>
    );
};

export default Plan;
