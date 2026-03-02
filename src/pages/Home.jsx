import React, { useState, useEffect } from 'react';
import { Menu, Bell, Dumbbell, Apple, Flower2, ChevronRight, CheckCircle2, Moon, Plus, Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Section from '../components/Section';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import CreateWorkoutModal from '../components/CreateWorkoutModal';
import DayScheduleModal from '../components/DayScheduleModal';



const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [headerName, setHeaderName] = useState('Athlete');

    const [scheduledWorkout, setScheduledWorkout] = useState(null);
    const [scheduledExercises, setScheduledExercises] = useState([]);
    const [weekSchedule, setWeekSchedule] = useState([]);
    const [weekDates, setWeekDates] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedDaySchedule, setSelectedDaySchedule] = useState(null);
    const [indicators, setIndicators] = useState({ training: 0, nutrition: 0, mindfulness: 0 });

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

                const { data: weekData } = await supabase
                    .from('schedule')
                    .select('*, workouts(*)')
                    .eq('user_id', user.id)
                    .gte('scheduled_date', startDateStr)
                    .lte('scheduled_date', endDateStr);

                setWeekSchedule(weekData || []);
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
                <button className="text-sikan-dark">
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
                <div className="bg-[#EAE4DC] rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <Dumbbell size={24} strokeWidth={1.5} className="text-sikan-dark mb-3" />
                    <span className="text-[10px] uppercase font-semibold text-sikan-dark tracking-wider mb-1">Training</span>
                    <span className="text-2xl font-bold text-sikan-dark tracking-tighter">{indicators.training}%</span>
                </div>
                {/* Nutrition */}
                <div className="bg-sikan-olive rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg shadow-sikan-olive/30 transform scale-105 z-10">
                    <Apple size={24} strokeWidth={1.5} className="text-sikan-bg mb-3" />
                    <span className="text-[10px] uppercase font-semibold text-sikan-bg/90 tracking-wider mb-1">Nutrition</span>
                    <span className="text-2xl font-bold text-sikan-bg tracking-tighter">{indicators.nutrition}%</span>
                </div>
                {/* Mindfulness */}
                <div className="bg-[#E3C7A1] rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <Flower2 size={24} strokeWidth={1.5} className="text-[#A47146] mb-3" />
                    <span className="text-[10px] uppercase font-semibold text-[#A47146] tracking-wider mb-1">Mindfulness</span>
                    <span className="text-2xl font-bold text-[#A47146] tracking-tighter">{indicators.mindfulness}%</span>
                </div>
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

            {/* Weekly Goals */}
            <div>
                <div className="flex justify-between items-end mb-5">
                    <h3 className="text-lg font-bold text-sikan-dark">Weekly Goals</h3>
                    <button className="text-xs font-semibold text-sikan-muted hover:text-sikan-dark uppercase tracking-wider">See all</button>
                </div>

                <div className="flex flex-col gap-5">
                    {/* Goal 1 */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-sikan-dark">Target Target</span>
                            <span className="font-bold text-sikan-dark">100%</span>
                        </div>
                        <div className="w-full bg-sikan-border h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-sikan-olive rounded-full w-full"></div>
                        </div>
                    </div>
                    {/* Goal 2 */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-sikan-dark">Evenn Target</span>
                            <span className="font-bold text-sikan-dark">70%</span>
                        </div>
                        <div className="w-full bg-sikan-border h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-sikan-muted rounded-full w-[70%]"></div>
                        </div>
                    </div>
                    {/* Goal 3 */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-sikan-dark">Connnonmy Target</span>
                            <span className="font-bold text-sikan-dark">60%</span>
                        </div>
                        <div className="w-full bg-sikan-border h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-sikan-muted rounded-full w-[60%]"></div>
                        </div>
                    </div>
                </div>
            </div>

            {showCreateModal && (
                <CreateWorkoutModal
                    onClose={() => setShowCreateModal(false)}
                    onWorkoutCreated={handleWorkoutCreated}
                />
            )}

            {selectedDaySchedule && (
                <DayScheduleModal
                    date={selectedDaySchedule.date}
                    scheduleItems={selectedDaySchedule.items}
                    onClose={() => setSelectedDaySchedule(null)}
                />
            )}
        </div>
    );
};

export default Home;
