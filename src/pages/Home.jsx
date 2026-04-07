import React, { useState, useEffect } from 'react';
import { Menu, Bell, Dumbbell, Apple, Flower2, ChevronRight, CheckCircle2, Moon, Plus, Activity, Target } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Section from '../components/Section';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import CreateWorkoutModal from '../components/CreateWorkoutModal';
import DayScheduleModal from '../components/DayScheduleModal';
import CategoryScheduleModal from '../components/CategoryScheduleModal';
import CreateGoalModal from '../components/CreateGoalModal';



const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [headerName, setHeaderName] = useState('Athlete');

    const [scheduledWorkout, setScheduledWorkout] = useState(null);
    const [scheduledExercises, setScheduledExercises] = useState([]);
    const [weekSchedule, setWeekSchedule] = useState([]);
    const [weekDates, setWeekDates] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [selectedDaySchedule, setSelectedDaySchedule] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [indicators, setIndicators] = useState({ training: 0, nutrition: 0, mindfulness: 0 });
    const [activeGoals, setActiveGoals] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Get Profile Name
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profile?.full_name) {
                    setHeaderName(profile.full_name.split(' ')[0]);
                } else if (user.email) {
                    setHeaderName(user.email.split('@')[0]);
                }

                // 2. Check for Scheduled Workout TODAY
                const today = new Date().toISOString().split('T')[0];
                const { data: schedule } = await supabase
                    .from('schedule')
                    .select('*, workouts(*)')
                    .eq('user_id', user.id)
                    .eq('scheduled_date', today)
                    .maybeSingle();

                if (schedule?.workouts) {
                    setScheduledWorkout(schedule.workouts);

                    // Fetch preview exercises for this workout
                    const { data: exercises } = await supabase
                        .from('workout_exercises')
                        .select('exercises(name)')
                        .eq('workout_id', schedule.workouts.id)
                        .order('order_index')
                        .limit(4); // Just grab first 4 for preview

                    if (exercises) {
                        setScheduledExercises(exercises.map(e => e.exercises.name));
                    }
                } else {
                    // Deliberately empty - no fallback
                    setScheduledWorkout(null);
                    setScheduledExercises([]);
                }

                // 3. Fetch Weekly Schedule
                const startOfWeek = new Date();
                const day = startOfWeek.getDay() || 7;
                if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
                else startOfWeek.setHours(0, 0, 0, 0);

                const dates = [];
                for (let i = 0; i < 7; i++) {
                    const d = new Date(startOfWeek);
                    d.setDate(startOfWeek.getDate() + i);
                    dates.push(d);
                }
                const startDateStr = dates[0].toISOString().split('T')[0];
                const endDateStr = dates[6].toISOString().split('T')[0];

                const [scheduleRes, logsRes] = await Promise.all([
                    supabase
                        .from('schedule')
                        .select('*, workouts(*)')
                        .eq('user_id', user.id)
                        .gte('scheduled_date', startDateStr)
                        .lte('scheduled_date', endDateStr),
                    supabase
                        .from('workout_logs')
                        .select('*')
                        .eq('user_id', user.id)
                        .gte('started_at', `${startDateStr}T00:00:00.000Z`)
                        .lte('started_at', `${endDateStr}T23:59:59.999Z`)
                        .not('strava_activity_id', 'is', null)
                ]);

                let mergedSchedule = scheduleRes.data ? [...scheduleRes.data] : [];
                
                logsRes.data?.forEach(log => {
                    const dateStr = log.started_at.split('T')[0];
                    const timeStr = log.started_at.split('T')[1].substring(0, 5);
                    mergedSchedule.push({
                        id: log.id,
                        scheduled_date: dateStr,
                        scheduled_time: `${timeStr}:00`,
                        is_rest_day: false,
                        is_strava: true,
                        workouts: {
                            id: log.id,
                            title: log.external_title || 'Cardio Activity',
                            type: 'Cardio',
                            duration_minutes: Math.round(log.moving_time_seconds / 60)
                        },
                        distance_meters: log.distance_meters,
                        activity_type: log.activity_type
                    });
                });

                setWeekSchedule(mergedSchedule);
                setWeekDates(dates);

                // 4. Calculate Analytics Indicators from Completed Logs
                const { data: logsData } = await supabase
                    .from('workout_logs')
                    .select('*, workouts(type)')
                    .eq('user_id', user.id)
                    .gte('completed_at', startDateStr);

                let trainCount = 0; let nutCount = 0; let mindCount = 0;

                (logsData || []).forEach(log => {
                    const type = log.workouts?.type || 'Strength'; // Fallback to strength for old workouts
                    if (type === 'Strength' || type === 'Cardio') trainCount++;
                    else if (type === 'Nutrition') nutCount++;
                    else if (type === 'Yoga' || type === 'Mindfulness') mindCount++;
                });

                setIndicators({
                    training: Math.min(Math.round((trainCount / 4) * 100), 100) || 0, // Goal: 4 workouts/week
                    nutrition: Math.min(Math.round((nutCount / 14) * 100), 100) || 0, // Goal: 14 meals/week
                    mindfulness: Math.min(Math.round((mindCount / 2) * 100), 100) || 0 // Goal: 2 sessions/week
                });
                
                // 5. Fetch Active Goals & Calculate Progress
                const { data: dbGoals } = await supabase
                    .from('goals')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });
                    
                if (dbGoals && dbGoals.length > 0) {
                     const computedGoals = await Promise.all(dbGoals.map(async (goal) => {
                         let currentProgress = 0;
                         
                         if (goal.target_metric === 'distance_km') {
                             // Fetch all cardio logs since goal creation
                             const { data: cLogs } = await supabase.from('workout_logs')
                                .select('distance_meters')
                                .eq('user_id', user.id)
                                .gte('started_at', goal.created_at)
                                .not('distance_meters', 'is', null);
                                
                             if (cLogs) {
                                  const totalMeters = cLogs.reduce((sum, log) => sum + (log.distance_meters || 0), 0);
                                  currentProgress = parseFloat((totalMeters / 1000).toFixed(2));
                             }
                         } else {
                             // Sessions or Volume_kg: needs matching workouts
                             // Supabase has no direct cross table where simple queries, so we do inner join
                             const { data: wLogs } = await supabase.from('workout_logs')
                                .select('id, workouts!inner(goal_id)')
                                .eq('user_id', user.id)
                                .eq('workouts.goal_id', goal.id)
                                .eq('status', 'completed')
                                .gte('completed_at', goal.created_at);
                                
                             if (wLogs) {
                                  if (goal.target_metric === 'sessions') {
                                       currentProgress = wLogs.length;
                                  } else if (goal.target_metric === 'volume_kg') {
                                       // we would need exercise_logs, which is expensive to load all.
                                       // For MVP, we query exercise logs for these workout ids
                                       const logIds = wLogs.map(l => l.id);
                                       if (logIds.length > 0) {
                                            const { data: exLogs } = await supabase.from('exercise_logs')
                                                .select('weight_kg, reps_completed')
                                                .in('workout_log_id', logIds)
                                                .eq('is_completed', true);
                                                
                                            if (exLogs) {
                                                currentProgress = exLogs.reduce((sum, el) => sum + ((parseFloat(el.weight_kg)||0) * (parseFloat(el.reps_completed)||0)), 0);
                                            }
                                       }
                                  }
                             }
                         }
                         
                         // Cap at 100% just for display progress, but keep real value
                         return {
                             ...goal,
                             currentProgress,
                             percent: Math.min((currentProgress / goal.target_value) * 100, 100)
                         };
                     }));
                     setActiveGoals(computedGoals);
                } else {
                     setActiveGoals([]);
                }

            } catch (error) {
                console.error("Error fetching home data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleWorkoutCreated = (newWorkout) => {
        // Automatically route to Plan to schedule the new workout, or we could auto-schedule it for today.
        // For now, let's keep it simple and route to Plan.
        navigate('/plan');
    };

    return (
        <div className="min-h-screen bg-sikan-bg text-sikan-dark px-6 pt-12 pb-28 font-sans selection:bg-sikan-gold/30 relative">
            {/* Top Navigation Bar */}
            <header className="mb-10 flex justify-between items-center">
                <button onClick={() => alert("Settings/Menu coming soon!")} className="text-sikan-dark hover:text-sikan-olive transition-colors">
                    <Menu size={24} strokeWidth={1.5} />
                </button>
                <img src="/logo.jpg" alt="SIKAN Logo" className="w-16 h-auto drop-shadow-sm mix-blend-multiply" />
                <button className="relative text-sikan-dark">
                    <Bell size={24} strokeWidth={1.5} />
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-rose-500 rounded-full border border-sikan-bg"></span>
                </button>
            </header>

            {/* Title */}
            <div className="mb-8">
                <h1 className="text-3xl font-serif text-sikan-dark mb-1">
                    Today's Focus:
                </h1>
                <h2 className="text-3xl font-serif font-bold text-sikan-dark tracking-tight">
                    Mindful Flow.
                </h2>
            </div>

            {/* Today's Focus Widgets */}
            <div className="grid grid-cols-3 gap-3 mb-10">
                {/* Training */}
                <button onClick={() => setSelectedCategory('Training')} className="bg-[#EAE4DC] hover:bg-[#E3DCD4] transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center outline-none">
                    <Dumbbell size={24} strokeWidth={1.5} className="text-sikan-dark mb-3" />
                    <span className="text-[10px] uppercase font-semibold text-sikan-dark tracking-wider mb-1">Training</span>
                    <span className="text-2xl font-bold text-sikan-dark tracking-tighter">{indicators.training}%</span>
                </button>
                {/* Nutrition */}
                <button onClick={() => setSelectedCategory('Nutrition')} className="bg-sikan-olive hover:bg-sikan-dark transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg shadow-sikan-olive/30 transform scale-105 z-10 outline-none">
                    <Apple size={24} strokeWidth={1.5} className="text-sikan-bg mb-3" />
                    <span className="text-[10px] uppercase font-semibold text-sikan-bg/90 tracking-wider mb-1">Nutrition</span>
                    <span className="text-2xl font-bold text-sikan-bg tracking-tighter">{indicators.nutrition}%</span>
                </button>
                {/* Mindfulness */}
                <button onClick={() => setSelectedCategory('Mindfulness')} className="bg-[#E3C7A1] hover:bg-[#DABF99] transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center outline-none">
                    <Flower2 size={24} strokeWidth={1.5} className="text-[#A47146] mb-3" />
                    <span className="text-[10px] uppercase font-semibold text-[#A47146] tracking-wider mb-1">Mindfulness</span>
                    <span className="text-2xl font-bold text-[#A47146] tracking-tighter">{indicators.mindfulness}%</span>
                </button>
            </div>

            {/* Your Plan */}
            <div className="mb-10">
                <h3 className="text-lg font-bold text-sikan-dark mb-4">Your Plan</h3>

                <div className="flex flex-col gap-3">
                    {/* Item 1 */}
                    <div
                        onClick={() => scheduledWorkout ? navigate(`/workout/${scheduledWorkout.id}`) : navigate('/plan')}
                        className="bg-sikan-card rounded-2xl p-4 flex items-center justify-between shadow-sm border border-sikan-border cursor-pointer active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-sikan-bg flex items-center justify-center">
                                <Activity size={20} strokeWidth={1.5} className="text-sikan-dark" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sikan-dark text-sm">{scheduledWorkout ? scheduledWorkout.title : "Morning Yoga Flow"}</h4>
                                <p className="text-xs text-sikan-muted font-medium mt-0.5">{scheduledWorkout ? `${scheduledWorkout.duration_minutes || 45} min` : "40 min"}</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-sikan-muted" />
                    </div>

                    {/* Item 2 */}
                    <div className="bg-sikan-card rounded-2xl p-4 flex items-center justify-between shadow-sm border border-sikan-border opacity-70">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-sikan-bg flex items-center justify-center">
                                <Moon size={20} strokeWidth={1.5} className="text-sikan-dark" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sikan-dark text-sm">Evening Riverwalk</h4>
                                <p className="text-xs text-sikan-muted font-medium mt-0.5">30 min</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-sikan-muted" />
                    </div>
                </div>
            </div>

            {/* Active Goals */}
            <div>
                <div className="flex justify-between items-end mb-5">
                    <h3 className="text-lg font-bold text-sikan-dark leading-none">Active Targets</h3>
                    <div className="flex items-center gap-3">
                        <button className="text-xs font-semibold text-sikan-muted hover:text-sikan-dark uppercase tracking-wider">See all</button>
                        <button onClick={() => setShowGoalModal(true)} className="w-6 h-6 rounded-full bg-sikan-olive text-sikan-cream flex items-center justify-center shadow-md shadow-sikan-olive/30 hover:scale-105 active:scale-95 transition-all">
                            <Plus size={16} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-5">
                    {activeGoals.length > 0 ? (
                        activeGoals.map(goal => (
                            <div key={goal.id} className="bg-sikan-card/50 p-4 rounded-[20px] border border-sikan-border shadow-sm">
                                <div className="flex justify-between text-sm mb-2 items-end">
                                    <div>
                                        <span className="font-bold text-sikan-dark block">{goal.title}</span>
                                        <span className="text-[10px] font-bold text-sikan-muted uppercase tracking-wider block mt-0.5">
                                            {goal.currentProgress} / {goal.target_value} {goal.target_metric === 'distance_km' ? 'km' : goal.target_metric === 'sessions' ? 'sessions' : 'kg'}
                                        </span>
                                    </div>
                                    <span className="font-bold font-serif text-sikan-olive text-lg leading-none">{Math.round(goal.percent)}%</span>
                                </div>
                                <div className="w-full bg-[#EAE4DC] h-2.5 rounded-full overflow-hidden shadow-inner">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${goal.target_metric === 'distance_km' ? 'bg-[#4A7243]' : goal.target_metric === 'sessions' ? 'bg-sikan-olive' : 'bg-[#896f5b]'}`}
                                        style={{ width: `${goal.percent}%` }}
                                    ></div>
                                </div>
                                {goal.deadline && (
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#A47146] mt-3 text-right">
                                        Deadline: {new Date(goal.deadline).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 px-6 bg-sikan-card border border-sikan-border border-dashed rounded-[24px]">
                            <Target size={24} className="mx-auto text-sikan-muted mb-3" />
                            <p className="text-sm font-bold text-sikan-dark">No active targets set.</p>
                            <p className="text-xs text-sikan-muted mt-1 font-semibold">Click the + button to create a new goal.</p>
                        </div>
                    )}
                </div>
            </div>

            {showCreateModal && (
                <CreateWorkoutModal
                    onClose={() => setShowCreateModal(false)}
                    onWorkoutCreated={handleWorkoutCreated}
                />
            )}

            {showGoalModal && (
                <CreateGoalModal
                    onClose={() => setShowGoalModal(false)}
                    onGoalCreated={(newGoal) => {
                        // Optimistically ad
                        setActiveGoals([{...newGoal, currentProgress: 0, percent: 0}, ...activeGoals])
                    }}
                />
            )}

            {selectedDaySchedule && (
                <DayScheduleModal
                    date={selectedDaySchedule.date}
                    scheduleItems={selectedDaySchedule.items}
                    onClose={() => setSelectedDaySchedule(null)}
                />
            )}

            {selectedCategory && (
                <CategoryScheduleModal
                    category={selectedCategory}
                    weekSchedule={weekSchedule}
                    onClose={() => setSelectedCategory(null)}
                />
            )}
        </div>
    );
};

export default Home;
