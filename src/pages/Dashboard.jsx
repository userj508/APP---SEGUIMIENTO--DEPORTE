import React from 'react';
import { Trophy, Flame, Clock, Activity, Calendar } from 'lucide-react';

const Dashboard = () => {
    // Mock data for consistency chart
    const weeklyData = [
        { day: 'M', active: true, height: 'h-16' },
        { day: 'T', active: true, height: 'h-12' },
        { day: 'W', active: false, height: 'h-2' },
        { day: 'T', active: true, height: 'h-14' },
        { day: 'F', active: true, height: 'h-20' },
        { day: 'S', active: false, height: 'h-2' },
        { day: 'S', active: false, height: 'h-2' },
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-white px-6 pt-12 pb-24">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Overview</h2>
                    <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
                </div>
                <button className="p-3 bg-slate-800 rounded-full text-slate-400 hover:text-white transition">
                    <Calendar size={20} />
                </button>
            </header>

            {/* Weekly Consistency */}
            <section className="mb-8">
                <h2 className="text-lg font-bold mb-4">Weekly Consistency</h2>
                <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        {/* Background illustration placeholder if needed */}
                    </div>
                    <div className="flex justify-between items-end h-32 mb-2 relative z-10">
                        {weeklyData.map((day, index) => (
                            <div key={index} className="flex flex-col items-center group">
                                <div
                                    className={`w-3 rounded-full ${day.active ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-700'} ${day.height} transition-all duration-500`}
                                ></div>
                                <span className="text-xs text-slate-500 mt-3 font-medium group-hover:text-slate-300 transition-colors">{day.day}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Cards */}
            <section className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-800 flex flex-col">
                    <span className="text-xs text-slate-400 font-medium mb-1">Total Workouts</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">42</span>
                        <span className="text-xs text-emerald-500 font-bold">↑ 12%</span>
                    </div>
                </div>
                <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-800 flex flex-col">
                    <span className="text-xs text-slate-400 font-medium mb-1">Time Trained</span>
                    <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-white">18</span>
                        <span className="text-sm text-slate-400 font-medium ml-1">h</span>
                        <span className="text-3xl font-bold text-white ml-2">30</span>
                        <span className="text-sm text-slate-400 font-medium ml-1">m</span>
                    </div>
                </div>
                <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-800 flex items-center justify-between col-span-2">
                    <div>
                        <span className="text-xs text-slate-400 font-medium block mb-1">Current Streak</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-white">5</span>
                            <span className="text-sm text-slate-400 font-medium">Days</span>
                            <Flame size={18} className="text-orange-500 fill-orange-500 animate-pulse" />
                        </div>
                    </div>
                    {/* Optional sparkline or extra graphic could go here */}
                </div>
            </section>

            {/* Recent Achievements */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">Recent Achievements</h2>
                    <button className="text-xs font-bold text-blue-500 hover:text-blue-400 transition">View All</button>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center p-4 bg-slate-800/50 rounded-2xl border border-slate-800">
                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-blue-500 mr-4 shadow-inner shadow-black/50">
                            <Trophy size={16} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-white text-sm">New PB: Deadlift</h3>
                                <span className="text-[10px] text-slate-500 font-medium">Today</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">Reached 140kg today</p>
                        </div>
                    </div>

                    <div className="flex items-center p-4 bg-slate-800/50 rounded-2xl border border-slate-800">
                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-emerald-500 mr-4 shadow-inner shadow-black/50">
                            <Trophy size={16} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-white text-sm">7-Day Consistency King</h3>
                                <span className="text-[10px] text-slate-500 font-medium">2d ago</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">Never missed a session</p>
                        </div>
                    </div>

                    <div className="flex items-center p-4 bg-slate-800/50 rounded-2xl border border-slate-800">
                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-amber-500 mr-4 shadow-inner shadow-black/50">
                            <Flame size={16} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-white text-sm">Early Bird</h3>
                                <span className="text-[10px] text-slate-500 font-medium">5d ago</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">Logged a workout before 6 AM</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
