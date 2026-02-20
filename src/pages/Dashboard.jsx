import React from 'react';
import { Trophy, Flame, Clock, Activity, Calendar } from 'lucide-react';

const Dashboard = () => {
    // Mock data for consistency chart
    const weeklyData = [
        { day: 'M', active: true, height: 'h-12' },
        { day: 'T', active: true, height: 'h-8' },
        { day: 'W', active: false, height: 'h-1.5' },
        { day: 'T', active: true, height: 'h-10' },
        { day: 'F', active: true, height: 'h-16' },
        { day: 'S', active: false, height: 'h-1.5' },
        { day: 'S', active: false, height: 'h-1.5' },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white px-5 pt-10 pb-28 font-sans selection:bg-emerald-500/30">
            <header className="mb-10 flex justify-between items-center">
                <div>
                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Overview</h2>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Progress</h1>
                </div>
                <button className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 text-slate-300 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-colors">
                    <Calendar size={18} />
                </button>
            </header>

            {/* Weekly Consistency */}
            <section className="mb-8">
                <div className="flex justify-between items-end mb-4">
                    <h2 className="text-lg font-bold">Consistency</h2>
                    <span className="text-xs font-semibold text-emerald-500">Good standing</span>
                </div>
                <div className="bg-slate-900 p-6 rounded-[24px] border border-white/5 relative overflow-hidden">
                    <div className="flex justify-between items-end h-28 mb-1 relative z-10 w-full px-2">
                        {weeklyData.map((day, index) => (
                            <div key={index} className="flex flex-col items-center group w-full relative">
                                <div
                                    className={`w-2 transition-all duration-700 ease-out rounded-full ${day.active ? 'bg-slate-200 group-hover:bg-white' : 'bg-slate-800'} ${day.height}`}
                                ></div>
                                <span className="text-[10px] text-slate-500 font-bold uppercase mt-4">{day.day}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Cards */}
            <section className="grid grid-cols-2 gap-3 mb-10">
                <div className="bg-slate-900 p-5 rounded-[20px] border border-white/5 flex flex-col justify-between min-h-[110px]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Sessions</span>
                    <div className="flex items-baseline gap-2 mt-auto">
                        <span className="text-3xl font-bold tracking-tight text-white">42</span>
                        <span className="text-[10px] text-emerald-500 font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 block mb-1">↑ 12%</span>
                    </div>
                </div>
                <div className="bg-slate-900 p-5 rounded-[20px] border border-white/5 flex flex-col justify-between min-h-[110px]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Duration</span>
                    <div className="flex items-baseline mt-auto">
                        <span className="text-3xl font-bold tracking-tight text-white">18</span>
                        <span className="text-xs text-slate-500 font-semibold ml-0.5 mr-1.5">h</span>
                        <span className="text-3xl font-bold tracking-tight text-white">30</span>
                        <span className="text-xs text-slate-500 font-semibold ml-0.5">m</span>
                    </div>
                </div>
                <div className="bg-slate-900 p-5 rounded-[20px] border border-white/5 flex items-center justify-between col-span-2">
                    <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Current Streak</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight text-white">5</span>
                            <span className="text-xs text-slate-400 font-semibold">Days</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-inner shadow-black/20">
                        <Flame size={20} className="fill-current" />
                    </div>
                </div>
            </section>

            {/* Recent Achievements */}
            <section>
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-bold">Recent Milestones</h2>
                    <button className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">View All</button>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center p-4 bg-slate-900 rounded-[20px] border border-white/5 group transition-colors hover:border-white/10">
                        <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center text-slate-300 mr-4 border border-white/5 shadow-inner">
                            <Trophy size={18} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-white text-sm">New PR: Deadlift</h3>
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Today</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">Reached 140kg today</p>
                        </div>
                    </div>

                    <div className="flex items-center p-4 bg-slate-900 rounded-[20px] border border-white/5 group transition-colors hover:border-white/10">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mr-4 border border-emerald-500/20 shadow-inner">
                            <Activity size={18} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-white text-sm">7-Day Consistency</h3>
                                <span className="text-[10px] text-slate-500 font-bold uppercase">2d ago</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">Never missed a session</p>
                        </div>
                    </div>

                    <div className="flex items-center p-4 bg-slate-900 rounded-[20px] border border-white/5 group transition-colors hover:border-white/10">
                        <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center text-slate-300 mr-4 border border-white/5 shadow-inner">
                            <Clock size={18} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-white text-sm">Early Bird</h3>
                                <span className="text-[10px] text-slate-500 font-bold uppercase">5d ago</span>
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
