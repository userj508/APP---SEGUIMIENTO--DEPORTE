import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Clock, Activity, Calendar, Loader2, TrendingUp, Target, Map as MapIcon, X, BarChart2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ExerciseProgressModal from '../components/ExerciseProgressModal';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, BarChart, Bar } from 'recharts';

const Dashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [selectedMetric, setSelectedMetric] = useState(null);
    const [stats, setStats] = useState({
        totalSessions: 0,
        totalDurationMinutes: 0,
        currentStreak: 0,
        totalDistanceKm: 0,
        weeklyData: [],
        volumeData: [],
        radarData: [],
        drillDownData: [],
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

                // 4b. Sub-routine: Weekly Buckets calculation for Drill Downs (Last 12 weeks)
                const drillDownData = [];
                for (let i = 11; i >= 0; i--) {
                    const startOfWeek = new Date();
                    startOfWeek.setDate(startOfWeek.getDate() - (i * 7) - startOfWeek.getDay()); // local Sunday
                    startOfWeek.setHours(0, 0, 0, 0);
                    
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    
                    const p1 = startOfWeek.getDate() + "/" + (startOfWeek.getMonth() + 1);
                    const p2 = endOfWeek.getDate() + "/" + (endOfWeek.getMonth() + 1);

                    drillDownData.push({
                        label: `${p1}-${p2}`,
                        shortLabel: `W${12-i}`,
                        timestamp: startOfWeek.getTime(),
                        sessions: 0,
                        duration: 0,
                        distance: 0
                    });
                }

                // Pour logs into weekly buckets
                safeLogs.forEach(log => {
                    const logDate = new Date(log.completed_at || log.started_at);
                    const logTime = logDate.getTime();
                    
                    for (let i = 0; i < drillDownData.length; i++) {
                        const bucketStart = drillDownData[i].timestamp;
                        const bucketEnd = bucketStart + (7 * 24 * 60 * 60 * 1000);
                        
                        // We give it a generous range. if it's earlier than the first bucket, it's ignored for drilldown
                        if (logTime >= bucketStart && logTime < bucketEnd) {
                            drillDownData[i].sessions += 1;
                            
                            let diffMins = 0;
                            if (log.started_at && log.completed_at && !log.moving_time_seconds) {
                                diffMins = Math.floor((new Date(log.completed_at) - new Date(log.started_at)) / 60000);
                            } else if (log.moving_time_seconds) {
                                diffMins = Math.floor(log.moving_time_seconds / 60);
                            }
                            if (diffMins > 0 && diffMins < 600) drillDownData[i].duration += diffMins;
                            
                            if (log.distance_meters) {
                                drillDownData[i].distance += parseFloat((log.distance_meters / 1000).toFixed(2));
                            }
                            break;
                        }
                    }
                });
                
                // Format decimal logic in array
                drillDownData.forEach(d => { d.distance = parseFloat(d.distance.toFixed(2)); });

                // 5. Generate Weekly Consistency Data (Last 7 Days)
                const last7DaysStart = new Date();
                last7DaysStart.setDate(last7DaysStart.getDate() - 6);
                last7DaysStart.setHours(0,0,0,0);

                const { data: scheduledSessions } = await supabase
                    .from('schedule')
                    .select('*, workouts(title)')
                    .eq('user_id', user.id)
                    .gte('scheduled_date', last7DaysStart.toISOString().split('T')[0]);

                const weekDays = [];
                const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

                for (let i = 6; i >= 0; i--) {
                    const checkDate = new Date();
                    checkDate.setDate(checkDate.getDate() - i);
                    const dateStr = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
                    
                    // Supabase 'date' type format YYYY-MM-DD
                    const mm = String(checkDate.getMonth() + 1).padStart(2, '0');
                    const dd = String(checkDate.getDate()).padStart(2, '0');
                    const isoDateStr = `${checkDate.getFullYear()}-${mm}-${dd}`;

                    const dayLogs = safeLogs.filter(log => {
                        const d = new Date(log.completed_at || log.started_at);
                        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === dateStr;
                    });
                    
                    const daySchedules = scheduledSessions?.filter(s => s.scheduled_date === isoDateStr) || [];
                    
                    const isCompleted = dayLogs.length > 0;
                    const isPlanned = daySchedules.length > 0;
                    // Because schedules lack timezone granularity, consider missed if today has passed or if it's a past day
                    const isMissed = isPlanned && !daySchedules.some(s => s.is_completed) && i > 0 && !isCompleted;
                    
                    let status = "none";
                    if (isCompleted) status = "completed";
                    else if (isMissed) status = "missed";
                    else if (isPlanned) status = "planned"; // Usually for today

                    let displayTitle = "";
                    if (isCompleted) {
                         const titles = dayLogs.map(l => l.workouts?.title || (l.distance_meters ? 'Cardio' : 'Custom Session'));
                         displayTitle = titles[0];
                         if (dayLogs.length > 1) displayTitle += " +1";
                    } else if (isPlanned || isMissed) {
                         displayTitle = daySchedules[0]?.workouts?.title || "Planned";
                    }

                    weekDays.push({
                        day: dayNames[checkDate.getDay()],
                        status: status,
                        title: displayTitle
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
                    drillDownData,
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

            {/* Consistency */}
            <section className="mb-10">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-serif font-bold text-sikan-dark">Consistency</h2>
                    <span className="text-xs font-bold text-sikan-olive px-3 py-1 bg-sikan-olive/10 rounded-full">Last 7 Days</span>
                </div>
                
                <div className="flex gap-2 w-full overflow-x-auto pb-4 hide-scrollbar snap-x px-1">
                    {stats.weeklyData.map((day, index) => (
                        <div key={index} className={`shrink-0 w-[4.8rem] h-[6rem] p-3 rounded-[20px] flex flex-col items-center justify-between border snap-center transition-transform hover:scale-105 ${
                            day.status === 'completed' ? 'bg-sikan-olive text-sikan-cream border-sikan-olive shadow-sm' :
                            day.status === 'missed' ? 'bg-[#FAF8F5] text-red-500 border-red-200 border-dashed opacity-80' :
                            day.status === 'planned' ? 'bg-[#FAF8F5] text-sikan-gold border-sikan-gold border-dashed shadow-sm' :
                            'bg-[#FAF8F5] text-sikan-muted border-sikan-border'
                        }`}>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${day.status === 'completed' || day.status === 'planned' ? 'opacity-90' : 'opacity-50'}`}>{day.day}</span>
                            
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center -my-2 ${
                                day.status === 'completed' ? 'bg-white/20' : 
                                day.status === 'planned' ? 'bg-sikan-gold/10' : ''
                            }`}>
                                {day.status === 'completed' ? <Activity size={14} strokeWidth={2.5} /> :
                                 day.status === 'missed' ? <X size={14} strokeWidth={2.5} className="text-red-400 opacity-60" /> :
                                 day.status === 'planned' ? <Calendar size={14} strokeWidth={2.5} className="text-sikan-gold" /> :
                                 <div className="w-1.5 h-1.5 rounded-full bg-sikan-border" />}
                            </div>
                            
                            {day.title ? (
                                 <span className={`text-[9px] font-bold text-center leading-tight truncate w-full ${day.status === 'missed' ? 'line-through opacity-60' : ''}`}>{day.title}</span>
                            ) : (
                                 <span className="text-[9px] font-bold text-center opacity-40">-</span>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Stats Cards - Clickable for Drill Down */}
            <section className="grid grid-cols-2 gap-3 mb-10">
                <button onClick={() => setSelectedMetric('sessions')} className="bg-sikan-card p-5 rounded-[20px] border border-sikan-border shadow-sm flex flex-col justify-between min-h-[110px] text-left transition-all active:scale-95 hover:border-sikan-olive/30 overflow-hidden relative group">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-sikan-olive/5 rounded-full group-hover:bg-sikan-olive/10 transition-colors"></div>
                    <span className="text-[10px] text-sikan-muted font-bold uppercase tracking-widest relative z-10 flex items-center gap-1">Sessions <BarChart2 size={10} className="opacity-50"/></span>
                    <div className="flex items-baseline gap-2 mt-auto relative z-10">
                        <span className="text-3xl font-serif font-bold tracking-tight text-sikan-dark">{stats.totalSessions}</span>
                    </div>
                </button>
                <button onClick={() => setSelectedMetric('duration')} className="bg-sikan-card p-5 rounded-[20px] border border-sikan-border shadow-sm flex flex-col justify-between min-h-[110px] text-left transition-all active:scale-95 hover:border-sikan-olive/30 overflow-hidden relative group">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-sikan-gold/5 rounded-full group-hover:bg-sikan-gold/20 transition-colors"></div>
                    <span className="text-[10px] text-sikan-muted font-bold uppercase tracking-widest relative z-10 flex items-center gap-1">Duration <BarChart2 size={10} className="opacity-50"/></span>
                    <div className="flex items-baseline mt-auto relative z-10">
                        <span className="text-3xl font-serif font-bold tracking-tight text-sikan-dark">{hours}</span>
                        <span className="text-xs text-sikan-muted font-bold ml-0.5 mr-1.5">h</span>
                        <span className="text-3xl font-serif font-bold tracking-tight text-sikan-dark">{minutes}</span>
                        <span className="text-xs text-sikan-muted font-bold ml-0.5">m</span>
                    </div>
                </button>
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
                <button onClick={() => setSelectedMetric('distance')} className="bg-sikan-card p-5 rounded-[20px] border border-sikan-border shadow-sm flex items-center justify-between text-left transition-all active:scale-95 hover:border-[#4A7243]/30 overflow-hidden group">
                    <div>
                        <span className="text-[10px] text-sikan-muted font-bold uppercase tracking-widest block mb-1 flex items-center gap-1">Cardio Dist. <BarChart2 size={10} className="opacity-50"/></span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-serif font-bold tracking-tight text-sikan-dark">{stats.totalDistanceKm}</span>
                            <span className="text-xs text-sikan-muted font-bold">Km</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E1EEDE] text-[#4A7243] border border-[#C5DAC1] shadow-inner group-hover:bg-[#d0e5cc] transition-colors relative z-10">
                        <MapIcon size={20} className="stroke-current" />
                    </div>
                </button>
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
            {/* Drill Down Modals */}
            {selectedMetric && (
                <div className="fixed inset-0 z-[100] flex flex-col pt-10" onClick={() => setSelectedMetric(null)}>
                    <div className="absolute inset-0 bg-sikan-dark/40 backdrop-blur-sm -z-10 animate-fade-in" />
                    <div className="bg-sikan-cream w-full h-full p-6 pt-12 flex flex-col animate-slide-up rounded-t-[40px] shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-sikan-border rounded-full" />
                        <button onClick={() => setSelectedMetric(null)} className="absolute top-6 right-6 text-sikan-muted hover:text-sikan-dark transition-colors bg-[#EAE4DC] p-2 rounded-full touch-manipulation">
                            <X size={20} />
                        </button>
                        
                        <div className="mb-8">
                            <h2 className="text-2xl font-serif font-bold text-sikan-dark mb-2">
                                {selectedMetric === 'sessions' && 'Weekly Sessions'}
                                {selectedMetric === 'duration' && 'Total Duration'}
                                {selectedMetric === 'distance' && 'Cardio Distance'}
                            </h2>
                            <p className="text-xs font-semibold text-sikan-muted">
                                Accumulated over the last 12 weeks.
                            </p>
                        </div>
                        
                        <div className="flex-1 min-h-0 bg-white border border-[#EAE4DC] rounded-[32px] p-4 pt-10 shadow-inner">
                            <ResponsiveContainer width="100%" height="100%">
                                {selectedMetric === 'sessions' ? (
                                    <BarChart data={stats.drillDownData} margin={{ top: 0, right: 0, left: -20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE4DC" />
                                        <XAxis dataKey="shortLabel" axisLine={false} tickLine={false} tick={{ fill: '#7C8C77', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7C8C77', fontSize: 10 }} />
                                        <RechartsTooltip cursor={{fill: '#F4F1EA'}} contentStyle={{ backgroundColor: '#2A3A2F', borderRadius: '12px', border: 'none', color: '#FFF' }} />
                                        <Bar dataKey="sessions" fill="#8A9A5B" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                ) : selectedMetric === 'duration' ? (
                                    <AreaChart data={stats.drillDownData} margin={{ top: 0, right: 0, left: -20, bottom: 20 }}>
                                        <defs>
                                            <linearGradient id="colorDur" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE4DC" />
                                        <XAxis dataKey="shortLabel" axisLine={false} tickLine={false} tick={{ fill: '#7C8C77', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7C8C77', fontSize: 10 }} />
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#2A3A2F', borderRadius: '12px', border: 'none', color: '#FFF' }} formatter={(value) => [`${value} min`, 'Duration']} />
                                        <Area type="monotone" dataKey="duration" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorDur)" activeDot={{ r: 6 }} />
                                    </AreaChart>
                                ) : (
                                    <AreaChart data={stats.drillDownData} margin={{ top: 0, right: 0, left: -20, bottom: 20 }}>
                                        <defs>
                                            <linearGradient id="colorDist" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4A7243" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#4A7243" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE4DC" />
                                        <XAxis dataKey="shortLabel" axisLine={false} tickLine={false} tick={{ fill: '#7C8C77', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7C8C77', fontSize: 10 }} />
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#2A3A2F', borderRadius: '12px', border: 'none', color: '#FFF' }} formatter={(value) => [`${value} km`, 'Distance']} />
                                        <Area type="monotone" dataKey="distance" stroke="#4A7243" strokeWidth={3} fillOpacity={1} fill="url(#colorDist)" activeDot={{ r: 6 }} />
                                    </AreaChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
