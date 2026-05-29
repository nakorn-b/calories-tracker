import React, { useState } from "react";
import type { FoodItem } from "../types";
import { logMeal } from "../services/foodService";

interface AddFoodProps {
  onSave: (item: Omit<FoodItem, "id">) => Promise<void>;
  onCancel: () => void;
}

export function AddFood({ onSave, onCancel }: AddFoodProps) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [category, setCategory] = useState<FoodItem["category"]>("Lunch");
  
  // New States for Custom Date and Time
  const [customDate, setCustomDate] = useState(new Date().toISOString().split("T")[0]);
  const [customTime, setCustomTime] = useState(new Date().toTimeString().slice(0, 5));
  const [isSaving, setIsSaving] = useState(false);

  const formatAMPM = (timeStr: string) => {
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0] || '0');
    let minutes = parseInt(parts[1] || '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await onSave({
        name,
        calories: parseInt(calories) || 0,
        protein: parseInt(protein) || 0,
        category,
        time: formatAMPM(customTime),
        date: customDate,
      });
    } catch (err) {
      console.error("Failed to save food:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="py-4 sm:py-8 duration-300">
      <div className="w-full bg-surface-container-low rounded-[2rem] p-6 sm:p-8 shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-container to-secondary-container opacity-50"></div>
        <div className="mb-8">
          <h2 className="font-headline font-extrabold text-2xl sm:text-3xl text-on-surface mb-1">Add Food</h2>
          <p className="font-label text-on-surface-variant text-xs sm:text-sm tracking-wide">Enter nutrition details for your meal.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">
              Food Name
            </label>
            <div className="obsidian-inset rounded-xl p-1 focus-within:ring-1 focus-within:ring-primary transition-all">
              <input
                required
                className="w-full bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-stone-600 px-4 py-3 font-body text-sm sm:text-base"
                placeholder="e.g. Avocado Toast"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">
                Category
              </label>
              <div className="obsidian-inset rounded-xl p-1 focus-within:ring-1 focus-within:ring-primary transition-all">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-transparent border-none focus:ring-0 text-on-surface px-4 py-3 font-body text-sm sm:text-base appearance-none cursor-pointer"
                >
                  {["Breakfast", "Lunch", "Dinner", "Snack"].map((cat) => (
                    <option key={cat} value={cat} className="bg-surface-container-highest">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">
                Log Date
              </label>
              <div 
                className="obsidian-inset rounded-xl p-1 focus-within:ring-1 focus-within:ring-primary transition-all cursor-pointer"
                onClick={(e) => {
                  const input = e.currentTarget.querySelector('input');
                  if (input) (input as any).showPicker?.();
                }}
              >
                <input
                  required
                  type="date"
                  className="w-full bg-transparent border-none focus:ring-0 text-on-surface px-4 py-3 font-body text-sm sm:text-base [color-scheme:dark] cursor-pointer"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">
                Calories
              </label>
              <div className="obsidian-inset rounded-xl p-1 focus-within:ring-1 focus-within:ring-primary transition-all">
                <input
                  required
                  type="number"
                  className="w-full bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-stone-600 px-4 py-3 font-body text-sm sm:text-base"
                  placeholder="0"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">
                Protein
              </label>
              <div className="obsidian-inset rounded-xl p-1 focus-within:ring-1 focus-within:ring-primary transition-all">
                <input
                  required
                  type="number"
                  className="w-full bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-stone-600 px-4 py-3 font-body text-sm sm:text-base"
                  placeholder="0"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                />
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">
                Time
              </label>
              <div 
                className="obsidian-inset rounded-xl p-1 focus-within:ring-1 focus-within:ring-primary transition-all cursor-pointer"
                onClick={(e) => {
                  const input = e.currentTarget.querySelector('input');
                  if (input) (input as any).showPicker?.();
                }}
              >
                <input
                  required
                  type="time"
                  className="w-full bg-transparent border-none focus:ring-0 text-on-surface px-4 py-3 font-body text-sm sm:text-base [color-scheme:dark] cursor-pointer"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className={`w-full ${isSaving ? 'bg-outline-variant/20 text-on-surface-variant' : 'bg-primary-container text-on-primary-container'} font-headline font-bold py-4 rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group`}
            >
              <span className={`material-symbols-outlined text-xl ${isSaving ? 'animate-spin' : 'group-hover:rotate-12'} transition-transform`}>
                {isSaving ? 'progress_activity' : 'save'}
              </span>
              {isSaving ? 'Saving...' : 'Save Food'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full mt-4 text-on-surface-variant font-label text-sm font-semibold uppercase tracking-widest hover:text-on-surface transition-colors py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
