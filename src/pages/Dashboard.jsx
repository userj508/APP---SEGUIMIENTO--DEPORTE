import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Clock, Activity, Calendar, Loader2, TrendingUp, Target, Map } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ExerciseProgressModal from '../components/ExerciseProgressModal';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';

const Dashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [stats, setStats] = useState({
        totalSessions: 0,
        totalDurationMinutes: 0,
        currentStreak: 0,
        totalDistanceKm: 0,
        weeklyData: [],
        volumeData: [],
        radarData: [],
        recentMilestones: [],
        performedExercises: []
    });

    useEffect(() => {
        if (!user) return;

        const loadDashboardData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Completed Workout Logs for user (now including exercise_logs for volume)
                const { data: logs, error } = await supabase
                    .from('workout_logs')
                    .select(`
                        *,
                        workouts(title),
                        exercise_logs(weight_kg, reps_completed, is_completed)
                    `)
                    .eq('user_id', user.id)
                    .eq('status', 'completed')
                    .order('completed_at', { ascending: false });

                if (error) throw error;

                // 2. Calculate Total Sessions
                const totalSessions = logs?.length || 0;

                // 3. Calculate Total Duration & Total Cardo Distance
                let totalMin = 0;
                let totalDistanceMeters = 0;
                logs?.forEach(log => {
                    if (log.started_at && log.completed_at && !log.moving_time_seconds) {
                        const start = new Date(log.started_at);
                        const end = new Date(log.completed_at);
                        const diffMins = Math.floor((end - start) / (1000 * 60));
                        if (diffMins > 0 && diffMins < 600) { // sanity check
                            totalMin += diffMins;
                        }
                    } else if (log.moving_time_seconds) {
                        totalMin += Math.floor(log.moving_time_seconds / 60);
                    }
                    
                    if (log.distance_meters) {
                        totalDistanceMeters += log.distance_meters;
                    }
                });
                const totalDistanceKm = (totalDistanceMeters / 1000).toFixed(1);

                // 3b. Calculate Volume per Workout (last 10)
                const safeLogs = logs || [];
                const volumeData = [];
                const last10Workouts = safeLogs.slice(0, 10).reverse();
                
                last10Workouts.forEach(log => {
                    let totalVolume = 0;
                    if (log.exercise_logs) {
                        log.exercise_logs.forEach(exLog => {
                            if (exLog.is_completed) {
                                totalVolume += (exLog.weight_kg || 0) * (exLog.reps_completed || 0);
                            }
                        });
                    }
                    
                    // Only push if it was a strength workout (volume > 0 or it has logs)
                    if (totalVolume > 0 || (log.exercise_logs && log.exercise_logs.length > 0)) {
                        const d = new Date(log.completed_at);
                        volumeData.push({
                            name: log.workouts?.title?.substring(0, 10) || 'Custom',
                            date: `${d.getDate()}/${d.getMonth()+1}`,
                            vol: totalVolume
                        });
                    }
                });

                // 4. Calculate Current Streak
                let streak = 0;
                let currentDate = new Date();
                currentDate.setHours(0, 0, 0, 0);

                // Create a Set of all unique local dates the user worked out
                const mappedDates = (logs || []).map(log => {
                    const d = new Date(log.completed_at);
                    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                });
                const activeDates = new Set(mappedDates);

                // Check streak backwards from today
                for (let i = 0; i < 365; i++) {
                    const checkDate = new Date(currentDate);
                    checkDate.setDate(currentDate.getDate() - i);
                    const dateStr = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;

                    if (activeDates.has(dateStr)) {
                        streak++;
                    } else if (i === 0) {
                        // If didn't workout today, streak is not broken yet (could workout later), 
                        // so we just continue to check yesterday.
                        continue;
                    } else {
                        // A past day was missed, streak broken
                        break;
                    }
                }

                // 5. Generate Weekly Consistency Data (Last 7 Days)
                const weekDays = [];
                const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

                for (let i = 6; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

                    weekDays.push({
                        day: dayNames[date.getDay()],
                        active: activeDates.has(dateStr),
                        height: activeDates.has(dateStr) ? 'h-12' : 'h-1.5' // Simple binary height for now
                    });
                }

                // 6. Recent Milestones (using latest 3 logs)
                const recentLogs = logs?.slice(0, 3) || [];
                const milestones = recentLogs.map(log => {
                    const d = new Date(log.completed_at);
                    const today = new Date();
                    const diffDays = Math.floor((today - d) / (1000 * 60 * 60 * 24));
                    let timeText = 'Today';
                    if (diffDays === 1) timeText = '1d ago';
                    if (diffDays > 1) timeText = `${diffDays}d ago`;

                    return {
                        id: log.id,
                        title: log.workouts?.title || 'Custom Session',
                        timeText: timeText,
                        icon: Activity,
                        desc: "Completed successfully"
                    };
                });

                // 7. Fetch all performed exercises for progress tracking
                const { data: exerciseLogs, error: exerciseError } = await supabase
                    .from('exercise_logs')
                    .select(`
                        exercise_id,
                        exercises ( name, category ),
                        workout_logs!inner ( user_id )
                    `)
                    .eq('is_completed', true)
                    .eq('workout_logs.user_id', user.id);

                if (exerciseError) console.error("Error fetching exercise logs:", exerciseError);

                const uniqueExercisesMap = new Map();
                const categoryDistributionMap = new Map();

                if (exerciseLogs) {
                    exerciseLogs.forEach(log => {
                        // Unique exercises tracking
                        if (!uniqueExercisesMap.has(log.exercise_id) && log.exercises) {
                            uniqueExercisesMap.set(log.exercise_id, {
                                id: log.exercise_id,
                                name: log.exercises.name,
                                category: log.exercises.category || 'Other',
                                logCount: 1
                            });
                        } else if (log.exercises) {
                            uniqueExercisesMap.get(log.exercise_id).logCount++;
                        }

                        // Category tracking for radar chart
                        if (log.exercises) {
                            const cat = log.exercises.category || 'Other';
                            // Exclude Rest/System categories from distribution
                            if (cat !== 'Rest' && cat !== 'System') {
                                categoryDistributionMap.set(cat, (categoryDistributionMap.get(cat) || 0) + 1);
                            }
                        }
                    });
                }
                const performedExercises = Array.from(uniqueExercisesMap.values()).sort((a, b) => b.logCount - a.logCount);

                let radarData = Array.from(categoryDistributionMap.entries())
                    .map(([category, count]) => ({
                        subject: category,
                        A: count
                    }))
                    .sort((a, b) => b.A - a.A)
                    .slice(0, 6); // Top 6 for a clean hexagon radar

                const counts = radarData.map(d => d.A);
                const maxCategoryCount = counts.length > 0 ? Math.max(...counts) : 1;
                radarData.forEach(d => d.fullMark = maxCategoryCount);


                setStats({
                    totalSessions,
                    totalDurationMinutes: totalMin,
                    currentStreak: streak,
                    totalDistanceKm,
                    weeklyData: weekDays,
                    volumeData,
                    radarData,
                    recentMilestones: milestones,
                    performedExercises
                });

            } catch (err) {
                console.error("Error loading dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [user]);

    const hours = Math.floor(stats.totalDurationMinutes / 60);
    const minutes = stats.totalDurationMinutes % 60;

    if (loading) {
        return <div className="min-h-screen bg-sikan-bg flex items-center justify-center"><Loader2 className="animate-spin text-sikan-olive" size={32} /></div>;
    }

    return (
        <div className="min-h-screen bg-sikan-bg text-sikan-dark px-5 pt-10 pb-28 font-sans selection:bg-sikan-gold/30">
            <header className="mb-10 flex justify-between items-center">
                <div>
                    <h2 className="text-xs font-semibold text-sikan-muted uppercase tracking-[0.2em] mb-1.5">Overview</h2>
                    <h1 className="text-3xl font-serif font-bold tracking-tight text-sikan-dark">Progress</h1>
                </div>
                <button className="w-10 h-10 rounded-full bg-sikan-card border border-sikan-border text-sikan-olive flex items-center justify-center hover:bg-[#EAE4DC] hover:text-sikan-dark shadow-sm transition-colors">
                    <Calendar size={18} />
                </button>
            </header>

            {/* Weekly Consistency */}
            <section className="mb-8">
                <div className="flex justify-between items-end mb-4">
                    <h2 className="text-lg font-serif font-bold text-sikan-dark">Consistency</h2>
                    <span className="text-xs font-bold text-sikan-olive">
                        {stats.currentStreak > 0 ? `${stats.currentStreak} Day Streak!` : 'Keep going!'}
                    </span>
                </div>
                <div className="bg-sikan-card p-6 rounded-[24px] border border-sikan-border shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-end h-28 mb-1 relative z-10 w-full px-2">
                        {stats.weeklyData.map((day, index) => (
                            <div key={index} className="flex flex-col items-center group w-full relative">
                                <div
                                    className={`w-2 transition-all duration-700 ease-out rounded-full ${day.active ? 'bg-sikan-olive group-hover:bg-sikan-dark' : 'bg-[#EAE4DC] group-hover:bg-[#E3C7A1]'} ${day.height}`}
                                ></div>
                                <span className="text-[10px] text-sikan-muted font-bold uppercase mt-4 tracking-wider">{day.day}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Cards */}
            <section className="grid grid-cols-2 gap-3 mb-10">
                <div className="bg-sikan-card p-5 rounded-[20px] border border-sikan-border shadow-sm flex flex-col justify-between min-h-[110px]">
                    <span className="text-[10px] text-sikan-muted font-bold uppercase tracking-widest">Total Sessions</span>
                    <div className="flex items-baseline gap-2 mt-auto">
                        <span className="text-3xl font-serif font-bold tracking-tight text-sikan-dark">{stats.totalSessions}</span>
                    </div>
                </div>
                <div className="bg-sikan-card p-5 rounded-[20px] border border-sikan-border shadow-sm flex flex-col justify-between min-h-[110px] overflow-hidden">
                    <span className="text-[10px] text-sikan-muted font-bold uppercase tracking-widest truncate">Duration</span>
                    <div className="flex items-baseline mt-auto">
                        <span className="text-3xl font-serif font-bold tracking-tight text-sikan-dark">{hours}</span>
                        <span className="text-xs text-sikan-muted font-bold ml-0.5 mr-1.5">h</span>
                        <span className="text-3xl font-serif font-bold tracking-tight text-sikan-dark">{minutes}</span>
                        <span className="text-xs text-sikan-muted font-bold ml-0.5">m</span>
                    </div>
                </div>
                <div className="bg-sikan-card p-5 rounded-[20px] border border-sikan-border shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[10px] text-sikan-muted font-bold uppercase tracking-widest block mb-1">Current Streak</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-serif font-bold tracking-tight text-sikan-dark">{stats.currentStreak}</span>
                            <span className="text-xs text-sikan-muted font-bold">Days</span>
                        </div>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-inner ${stats.currentStreak > 0 ? 'bg-[#FFEED9] text-[#A47146] border-[#E3C7A1]' : 'bg-[#EAE4DC] text-sikan-muted border-sikan-border'}`}>
                        <Flame size={20} className="fill-current" />
                    </div>
                </div>
                <div className="bg-sikan-card p-5 rounded-[20px] border border-sikan-border shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[10px] text-sikan-muted font-bold uppercase tracking-widest block mb-1">Cardio Dist.</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-serif font-bold tracking-tight text-sikan-dark">{stats.totalDistanceKm}</span>
                            <span className="text-xs text-sikan-muted font-bold">Km</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E1EEDE] text-[#4A7243] border border-[#C5DAC1] shadow-inner">
                        <Map size={20} className="stroke-current" />
                    </div>
                </div>
            </section>

            {/* NEW ANALYTICS SECTION */}
            <section className="mb-10">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-serif font-bold text-sikan-dark">Performance Analytics</h2>
                </div>

                {/* Radar Chart: Zonas Entrenadas */}
                <div className="bg-sikan-card border border-sikan-border rounded-[24px] p-5 mb-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Target size={16} className="text-sikan-olive" />
                        <h3 className="text-sm font-bold text-sikan-dark">Muscle Zone Distribution</h3>
                    </div>
                    <p className="text-[11px] text-sikan-muted font-medium mb-6">Percentage of exercises dedicated to each body part.</p>
                    
                    {stats.radarData && stats.radarData.length > 2 ? (
                        <div className="h-[250px] w-full -ml-3">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats.radarData}>
                                    <PolarGrid stroke="#EAE4DC" />
                                    <PolarAngleAxis 
                                        dataKey="subject" 
                                        tick={{ fill: '#7C8C77', fontSize: 11, fontWeight: 'bold' }} 
                                    />
                                    <Radar 
                                        name="Sets" 
                                        dataKey="A" 
                                        stroke="#8A9A5B" 
                                        fill="#8A9A5B" 
                                        fillOpacity={0.4} 
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-xs font-bold text-sikan-muted border border-dashed border-sikan-border rounded-xl">
                            Not enough data to calculate zones
                        </div>
                    )}
                </div>

                {/* Area Chart: Cargas de Fuerza */}
                <div className="bg-sikan-card border border-sikan-border rounded-[24px] p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-sikan-olive" />
                        <h3 className="text-sm font-bold text-sikan-dark">Workload Progression</h3>
                    </div>
                    <p className="text-[11px] text-sikan-muted font-medium mb-6">Total volume lifted (Sets x Reps x Weight) over recent workouts.</p>
                    
                    {stats.volumeData && stats.volumeData.length > 1 ? (
                        <div className="h-[220px] w-full -ml-5 mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.volumeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8A9A5B" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#8A9A5B" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE4DC" />
                                    <XAxis 
                                        dataKey="date" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#7C8C77', fontSize: 10, fontWeight: 'bold' }} 
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#7C8C77', fontSize: 10 }}
                                        tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}
                                    />
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: '#FAF8F5', borderRadius: '12px', border: '1px solid #EAE4DC', fontSize: '12px', fontWeight: 'bold', color: '#2A3A2F' }}
                                        itemStyle={{ color: '#8A9A5B' }}
                                        formatter={(value) => [`${value} kg`, 'Volume']}
                                        labelStyle={{ color: '#7C8C77', marginBottom: '4px' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="vol" 
                                        stroke="#8A9A5B" 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#colorVol)" 
                                        activeDot={{ r: 6, fill: '#8A9A5B', stroke: '#FFF', strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[150px] flex items-center justify-center text-xs font-bold text-sikan-muted border border-dashed border-sikan-border rounded-xl">
                            Complete strength workouts to see volume progression
                        </div>
                    )}
                </div>
            </section>

            {/* Recent History / Milestones */}
            <section>
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-serif font-bold text-sikan-dark">Recent History</h2>
                </div>

                {stats.recentMilestones.length > 0 ? (
                    <div className="space-y-3">
                        {stats.recentMilestones.map((milestone, idx) => {
                            const Icon = milestone.icon;
                            return (
                                <div key={idx} className="flex items-center p-4 bg-sikan-card rounded-[20px] border border-sikan-border group transition-all hover:shadow-md hover:border-sikan-olive/30">
                                    <div className="w-12 h-12 rounded-full bg-[#EAE4DC] flex items-center justify-center text-sikan-olive mr-4 border border-sikan-border shadow-inner group-hover:bg-sikan-olive group-hover:text-[#EAE4DC] transition-colors">
                                        <Icon size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-bold text-sikan-dark text-sm group-hover:text-sikan-olive transition-colors">{milestone.title}</h3>
                                            <span className="text-[10px] text-sikan-gold font-bold uppercase tracking-wider">{milestone.timeText}</span>
                                        </div>
                                        <p className="text-xs text-sikan-muted mt-0.5">{milestone.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 px-6 bg-sikan-card border border-sikan-border border-dashed rounded-[24px]">
                        <Trophy size={24} className="mx-auto text-sikan-muted mb-3" />
                        <p className="text-sm font-bold text-sikan-dark">No sessions recorded yet.</p>
                        <p className="text-xs text-sikan-muted mt-1 font-semibold">Complete a workout to see your history.</p>
                    </div>
                )}
            </section>

            {/* Exercise Progress Section */}
            <section className="mt-10">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-serif font-bold text-sikan-dark">Exercise Progress</h2>
                    <span className="text-xs font-bold text-sikan-olive tracking-wider uppercase">
                        {stats.performedExercises.length} Total
                    </span>
                </div>

                {stats.performedExercises.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                        {stats.performedExercises.map((exercise) => (
                            <div
                                key={exercise.id}
                                onClick={() => setSelectedExercise(exercise)}
                                className="bg-sikan-card p-4 rounded-[20px] border border-sikan-border flex flex-col justify-between min-h-[110px] cursor-pointer hover:shadow-md hover:border-sikan-olive/30 shadow-sm transition-all group"
                            >
                                <span className="text-[10px] text-sikan-gold-light font-bold uppercase tracking-widest">{exercise.category}</span>
                                <div className="mt-auto">
                                    <h3 className="text-sm font-bold text-sikan-dark mb-1.5 leading-tight group-hover:text-sikan-olive transition-colors">{exercise.name}</h3>
                                    <div className="flex items-center text-[10px] font-bold text-sikan-muted">
                                        <TrendingUp size={10} className="mr-1 text-sikan-olive" />
                                        {exercise.logCount} Sets Logged
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 px-6 bg-sikan-card border border-sikan-border border-dashed rounded-[24px]">
                        <Activity size={24} className="mx-auto text-sikan-muted mb-3" />
                        <p className="text-sm font-bold text-sikan-dark">No exercises tracked yet.</p>
                        <p className="text-xs text-sikan-muted mt-1 font-semibold">Complete workouts to see progress charts.</p>
                    </div>
                )}
            </section>

            {selectedExercise && (
                <ExerciseProgressModal
                    exercise={selectedExercise}
                    onClose={() => setSelectedExercise(null)}
                />
            )}
        </div>
    );
};

export default Dashboard;
