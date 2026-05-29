import React, { useState } from "react";
import type { FoodItem } from "../types";
import { useUserStore } from "../zustand";

interface SettingsProps {
  calorieGoal: number;
  proteinGoal: number;
  foodLog: FoodItem[];
  onUpdateGoals: (calories: number, protein: number) => void;
  onLogout: () => void;
}

export function Settings({ calorieGoal, proteinGoal, foodLog, onUpdateGoals, onLogout }: SettingsProps) {
  const user = useUserStore((state) => state.user)
  const [tempCalories, setTempCalories] = useState(calorieGoal.toString());
  const [tempProtein, setTempProtein] = useState(proteinGoal.toString());

  // Sync state with props when they change
  React.useEffect(() => {
    setTempCalories(calorieGoal.toString());
    setTempProtein(proteinGoal.toString());
  }, [calorieGoal, proteinGoal]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGoals(parseInt(tempCalories) || 0, parseInt(tempProtein) || 0);
  };

  const handleDownloadCSV = () => {
    if (foodLog.length === 0) {
      alert("No data available to download.");
      return;
    }

    const headers = ["Date", "Time", "Food Item", "Category", "Calories (kcal)", "Protein (g)"];
    const rows = foodLog.map(item => [
      item.date,
      item.time,
      `"${item.name.replace(/"/g, '""')}"`,
      item.category,
      item.calories,
      item.protein
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `food_log_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="py-4 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-headline font-extrabold text-2xl text-on-surface">Settings</h2>
          <p className="text-sm text-on-surface-variant">Manage your nutrition targets and session</p>
        </div>
      </div>

      <div className="bg-surface-container rounded-3xl p-8 border border-outline-variant/10 shadow-xl">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">
              Daily Calorie Goal (kcal)
            </label>
            <div className="obsidian-inset rounded-2xl p-1 focus-within:ring-1 focus-within:ring-primary transition-all">
              <input
                type="number"
                className="w-full bg-transparent border-none focus:ring-0 text-on-surface px-4 py-3 font-body text-lg"
                value={tempCalories}
                onChange={(e) => setTempCalories(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">
              Daily Protein Goal (g)
            </label>
            <div className="obsidian-inset rounded-2xl p-1 focus-within:ring-1 focus-within:ring-primary transition-all">
              <input
                type="number"
                className="w-full bg-transparent border-none focus:ring-0 text-on-surface px-4 py-3 font-body text-lg"
                value={tempProtein}
                onChange={(e) => setTempProtein(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-primary text-on-primary font-headline font-bold py-4 rounded-xl shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-xl">save</span>
              Save Targets
            </button>
          </div>
        </form>
      </div>

      <div className="bg-surface-container rounded-3xl p-8 border border-outline-variant/10 shadow-xl">
        <label className="block font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4 ml-1">
          Support & Management
        </label>
        <div className="space-y-3">
          <button
            onClick={handleDownloadCSV}
            className="w-full bg-primary/5 text-primary font-headline font-bold py-4 rounded-xl border border-primary/20 hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-xl">download</span>
            Download CSV History
          </button>
          
          <button
            onClick={onLogout}
            className="w-full bg-error/5 text-error font-headline font-bold py-4 rounded-xl border border-error/20 hover:bg-error/10 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            Sign Out
          </button>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/5">
        <div className="flex items-center gap-4 text-on-surface-variant">
          <span className="material-symbols-outlined">info</span>
          <p className="text-xs leading-relaxed">
            Locked session active. Your data is only accessible on this device while you remain signed in.
          </p>
        </div>
      </div>
    </div>
  );
}
