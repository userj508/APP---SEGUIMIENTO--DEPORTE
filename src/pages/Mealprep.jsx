import React, { useState, useEffect } from 'react';
import { Apple, Plus, CheckCircle2, Loader2, Calendar, Coffee, Utensils, UtensilsCrossed } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

const Mealprep = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [meals, setMeals] = useState([]);
    const [stats, setStats] = useState({ loggedThisWeek: 0, target: 14 });
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [newMeal, setNewMeal] = useState({ title: '', description: '', type: 'Lunch' });

    useEffect(() => {
        if (!user) return;
        fetchMeals();
    }, [user]);

    const fetchMeals = async () => {
        setLoading(true);
        try {
            // Fetch scheduled meals for the current week
            const startOfWeek = new Date();
            const day = startOfWeek.getDay() || 7;
            if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
            else startOfWeek.setHours(0, 0, 0, 0);

            const startDateStr = startOfWeek.toISOString().split('T')[0];
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            const endDateStr = endOfWeek.toISOString().split('T')[0];

            // In our system, meal preps are workouts of type 'Nutrition'
            const { data, error } = await supabase
                .from('schedule')
                .select('id, scheduled_date, workouts!inner(*), is_completed')
                .eq('user_id', user.id)
                .eq('workouts.type', 'Nutrition')
                .gte('scheduled_date', startDateStr)
                .lte('scheduled_date', endDateStr)
                .order('scheduled_date', { ascending: true });

            if (error) throw error;

            setMeals(data || []);
            setStats(prev => ({ ...prev, loggedThisWeek: data?.filter(m => m.is_completed).length || 0 }));
        } catch (error) {
            console.error("Error fetching meals:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMeal = async (e) => {
        e.preventDefault();
        if (!newMeal.title) return;
        setLoading(true);

        try {
            // First create the "workout" (Nutrition template)
            const { data: workout, error: workoutError } = await supabase
                .from('workouts')
                .insert({
                    user_id: user.id,
                    title: newMeal.title,
                    description: newMeal.description || newMeal.type,
                    type: 'Nutrition',
                    duration_minutes: 15
                })
                .select()
                .single();

            if (workoutError) throw workoutError;

            // Then schedule it for today
            const todayStr = new Date().toISOString().split('T')[0];
            const { error: scheduleError } = await supabase
                .from('schedule')
                .insert({
                    user_id: user.id,
                    workout_id: workout.id,
                    scheduled_date: todayStr
                });

            if (scheduleError) throw scheduleError;

            setShowAddMenu(false);
            setNewMeal({ title: '', description: '', type: 'Lunch' });
            fetchMeals();
        } catch (error) {
            console.error("Error adding meal:", error);
            alert("Error adding meal");
        } finally {
            setLoading(false);
        }
    };

    const toggleMealCompletion = async (scheduleId, currentState, workoutId) => {
        try {
            // Update UI optimistically
            setMeals(meals.map(m => m.id === scheduleId ? { ...m, is_completed: !currentState } : m));
            setStats(prev => ({
                ...prev,
                loggedThisWeek: prev.loggedThisWeek + (!currentState ? 1 : -1)
            }));

            // If we are marking it as completed, we should also log it in workout_logs for the Analytics
            if (!currentState) {
                await supabase.from('workout_logs').insert({
                    user_id: user.id,
                    workout_id: workoutId,
                    duration_minutes: 15, // Arbitrary duration for meal prep
                    completed_at: new Date().toISOString()
                });
            }

            // Update schedule table
            await supabase
                .from('schedule')
                .update({ is_completed: !currentState })
                .eq('id', scheduleId);

        } catch (error) {
            console.error("Error toggling meal:", error);
            fetchMeals(); // revert
        }
    };

    const getMealIconStyle = (description) => {
        const desc = (description || '').toLowerCase();
        if (desc.includes('breakfast') || desc.includes('coffee')) return <Coffee size={18} />;
        if (desc.includes('dinner')) return <UtensilsCrossed size={18} />;
        return <Utensils size={18} />;
    };

    if (loading && meals.length === 0) {
        return <div className="min-h-screen bg-sikan-bg flex items-center justify-center"><Loader2 className="animate-spin text-sikan-olive" size={32} /></div>;
    }

    return (
        <div className="min-h-screen bg-sikan-bg text-sikan-dark px-5 pt-10 pb-28 font-sans">
            <header className="mb-10 flex justify-between items-center">
                <div>
                    <h2 className="text-xs font-semibold text-sikan-muted uppercase tracking-[0.2em] mb-1.5">Nutrition</h2>
                    <h1 className="text-3xl font-serif font-bold tracking-tight text-sikan-dark">Meal Prep</h1>
                </div>
                <button
                    onClick={() => setShowAddMenu(true)}
                    className="w-10 h-10 rounded-full bg-sikan-olive text-sikan-bg flex items-center justify-center shadow-md hover:bg-sikan-dark transition-colors"
                >
                    <Plus size={20} />
                </button>
            </header>

            {/* Weekly Goal Progress */}
            <section className="mb-8 p-6 bg-sikan-card border border-sikan-border rounded-[24px] shadow-sm flex items-center justify-between">
                <div>
                    <span className="block text-[10px] uppercase font-bold text-sikan-muted tracking-widest mb-1">Weekly Target</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-serif font-bold text-sikan-dark">{stats.loggedThisWeek}</span>
                        <span className="text-sm font-bold text-sikan-muted">/ {stats.target}</span>
                    </div>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-[#EAE4DC] flex items-center justify-center relative">
                    <Apple size={24} className="text-sikan-olive" />
                    {/* Simplified progress ring with conic-gradient via inline style */}
                    <div
                        className="absolute inset-[-4px] rounded-full border-4 border-transparent"
                        style={{
                            borderImage: `conic-gradient(#5C684C ${(stats.loggedThisWeek / stats.target) * 100}%, transparent 0) 1`,
                            clipPath: 'circle(50% at 50% 50%)' // Fallback for cleaner edges if needed, though conic might need a custom class
                        }}
                    />
                </div>
            </section>

            {/* Meals List */}
            <section>
                <div className="flex justify-between items-end mb-4">
                    <h2 className="text-lg font-serif font-bold text-sikan-dark">This Week's Meals</h2>
                </div>

                {meals.length === 0 ? (
                    <div className="text-center py-12 px-6 bg-sikan-card border border-sikan-border border-dashed rounded-[24px]">
                        <Apple size={24} className="mx-auto text-sikan-muted mb-3" />
                        <p className="text-sm font-bold text-sikan-dark">No meals planned.</p>
                        <p className="text-xs text-sikan-muted mt-1 font-semibold">Track your nutrition to hit your goals.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {meals.map((meal) => (
                            <div key={meal.id} className="bg-sikan-card border border-sikan-border rounded-[20px] p-4 flex items-center justify-between group shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className={clsx(
                                        "w-12 h-12 rounded-full flex items-center justify-center shadow-inner transition-colors",
                                        meal.is_completed ? "bg-sikan-olive text-[#EAE4DC]" : "bg-[#EAE4DC] text-sikan-olive group-hover:bg-[#E3C7A1]"
                                    )}>
                                        {getMealIconStyle(meal.workouts?.description)}
                                    </div>
                                    <div>
                                        <h3 className={clsx("font-bold text-sm transition-colors", meal.is_completed ? "text-sikan-muted line-through" : "text-sikan-dark")}>
                                            {meal.workouts?.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-sikan-gold font-bold uppercase tracking-wider">{meal.workouts?.description || 'Meal'}</span>
                                            <span className="w-1 h-1 rounded-full bg-sikan-border"></span>
                                            <span className="text-[10px] text-sikan-muted font-bold tracking-wider">{new Date(meal.scheduled_date + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'short' })}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleMealCompletion(meal.id, meal.is_completed, meal.workouts?.id)}
                                    className="w-10 h-10 flex items-center justify-center text-sikan-muted hover:text-sikan-olive transition-colors"
                                >
                                    <CheckCircle2 size={24} className={meal.is_completed ? 'text-sikan-olive fill-sikan-olive/10' : ''} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Add Modal */}
            {showAddMenu && (
                <div className="fixed inset-0 bg-sikan-dark/40 backdrop-blur-md z-50 flex items-end sm:items-center justify-center sm:p-4">
                    <div className="bg-sikan-bg border-t sm:border border-sikan-border sm:rounded-[24px] rounded-t-[24px] w-full max-w-[500px] p-7 flex flex-col relative animate-in slide-in-from-bottom-4 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-serif font-bold text-sikan-dark">Log Meal</h2>
                            <button onClick={() => setShowAddMenu(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-sikan-card text-sikan-muted hover:text-sikan-dark">
                                X
                            </button>
                        </div>
                        <form onSubmit={handleAddMeal} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold text-sikan-muted tracking-widest uppercase mb-2">Meal Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newMeal.title}
                                    onChange={e => setNewMeal({ ...newMeal, title: e.target.value })}
                                    className="w-full bg-sikan-card border border-sikan-border rounded-[16px] px-5 py-4 text-sikan-dark focus:border-sikan-olive/30 outline-none font-bold text-sm"
                                    placeholder="e.g. Chicken & Rice"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-sikan-muted tracking-widest uppercase mb-2">Category</label>
                                <div className="flex gap-2">
                                    {['Breakfast', 'Lunch', 'Dinner'].map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setNewMeal({ ...newMeal, type: t, description: t })}
                                            className={`flex-1 py-3 rounded-[12px] border font-bold text-xs transition-colors ${newMeal.type === t ? 'bg-sikan-olive text-sikan-bg border-sikan-olive' : 'bg-sikan-card text-sikan-muted border-sikan-border'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-sikan-olive hover:bg-sikan-dark text-sikan-bg font-bold text-sm py-4 rounded-[16px] mt-2 shadow-md flex justify-center"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : "Add to Today"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Mealprep;
