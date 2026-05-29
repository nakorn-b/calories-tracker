import React, { useState, useEffect } from 'react';
import type { FoodItem } from '../types';
import { logMeal } from '../services/foodService';

interface FoodCardListProps {
  initialFoods: FoodItem[];
  onClose: () => void;
  title?: string;
}

export const FoodCardList: React.FC<FoodCardListProps> = ({ initialFoods, onClose, title = "Detected Meals" }) => {
  const [foods, setFoods] = useState<FoodItem[]>(initialFoods);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loggedIds, setLoggedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setFoods(initialFoods);
    setLoggedIds(new Set()); // Reset logged status when new foods are provided
  }, [initialFoods]);

  const handleInputChange = (id: string, field: keyof FoodItem, value: string | number) => {
    setFoods(prev => prev.map(food => 
      food.id === id ? { ...food, [field]: value } : food
    ));
  };

  const handleDelete = (id: string) => {
    setFoods(prev => prev.filter(food => food.id !== id));
  };

  const handleLog = async (food: FoodItem) => {
    if (loggedIds.has(food.id)) return;
    
    setLoadingId(food.id);
    try {
      const now = new Date();
      const mealToLog = {
        ...food,
        date: food.date || now.toISOString().split('T')[0],
        time: food.time || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      await logMeal(mealToLog);
      setLoggedIds(prev => new Set(prev).add(food.id));
    } catch (error) {
      console.error('Failed to log meal:', error);
      alert('Failed to log meal. Please try again.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface-container-low w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl border border-outline-variant/20 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 delay-100 fill-mode-both">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-headline font-extrabold text-on-surface">{title}</h2>
            <p className="text-sm text-on-surface-variant">Review and adjust details before logging</p>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto px-8 py-4 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {foods.length === 0 ? (
              <div className="py-12 text-center">
                <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">inventory_2</span>
                <p className="text-on-surface-variant">No items left to review</p>
              </div>
            ) : (
              foods.map((food) => {
                const isLogged = loggedIds.has(food.id);
                const isLoading = loadingId === food.id;

                return (
                  <div 
                    key={food.id} 
                    className={`group relative overflow-hidden bg-surface-container-high rounded-[2rem] p-5 border transition-all duration-300 ${
                      isLogged ? 'border-secondary/40 opacity-75' : 'border-outline-variant/30 hover:border-primary/40'
                    }`}
                  >
                    <div className="relative flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                              {food.category}
                            </span>
                            {isLogged && (
                              <span className="inline-flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-secondary text-on-secondary animate-in zoom-in duration-300">
                                <span className="material-symbols-outlined text-[10px]">check_circle</span>
                                Logged
                              </span>
                            )}
                          </div>
                          <input 
                            type="text" 
                            disabled={isLogged}
                            value={food.name}
                            onChange={(e) => handleInputChange(food.id, 'name', e.target.value)}
                            className="w-full bg-transparent text-xl font-headline font-bold text-on-surface focus:outline-none disabled:text-on-surface-variant"
                          />
                        </div>
                        
                        {!isLogged && (
                          <button 
                            onClick={() => handleDelete(food.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-all active:scale-90"
                            title="Remove from list"
                          >
                            <span className="material-symbols-outlined text-xl">delete</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-surface-container-low/50 rounded-2xl p-3 border border-outline-variant/10">
                          <label className="text-[10px] text-outline uppercase font-bold tracking-widest block mb-1">Calories</label>
                          <div className="flex items-baseline gap-1">
                            <input 
                              type="number" 
                              disabled={isLogged}
                              value={food.calories}
                              onChange={(e) => handleInputChange(food.id, 'calories', parseInt(e.target.value) || 0)}
                              className="bg-transparent w-full text-xl font-headline font-bold text-primary focus:outline-none disabled:text-outline-variant"
                            />
                            <span className="text-xs text-outline-variant">kcal</span>
                          </div>
                        </div>
                        
                        <div className="bg-surface-container-low/50 rounded-2xl p-3 border border-outline-variant/10">
                          <label className="text-[10px] text-outline uppercase font-bold tracking-widest block mb-1">Protein</label>
                          <div className="flex items-baseline gap-1">
                            <input 
                              type="number" 
                              disabled={isLogged}
                              value={food.protein}
                              onChange={(e) => handleInputChange(food.id, 'protein', parseInt(e.target.value) || 0)}
                              className="bg-transparent w-full text-xl font-headline font-bold text-secondary focus:outline-none disabled:text-outline-variant"
                            />
                            <span className="text-xs text-outline-variant">g</span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleLog(food)}
                        disabled={isLoading || isLogged}
                        className={`relative overflow-hidden w-full py-3.5 rounded-xl font-headline font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                          isLogged 
                            ? 'bg-secondary/20 text-secondary border border-secondary/30 cursor-default' 
                            : isLoading
                              ? 'bg-outline-variant/20 text-outline'
                              : 'bg-primary text-on-primary-container hover:shadow-lg hover:shadow-primary/10'
                        }`}
                      >
                        {isLoading ? (
                          <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                        ) : isLogged ? (
                          <span className="material-symbols-outlined text-sm">done_all</span>
                        ) : (
                          <span className="material-symbols-outlined text-sm">add</span>
                        )}
                        <span>{isLoading ? 'Logging...' : isLogged ? 'Logged Successfully' : 'Log Meal'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-surface-container/30 border-t border-outline-variant/10">
          <button 
            onClick={onClose}
            className="w-full py-4 text-on-surface-variant font-label text-sm font-semibold uppercase tracking-widest hover:text-on-surface transition-colors"
          >
            Finished Reviewing
          </button>
        </div>
      </div>
    </div>
  );
};
