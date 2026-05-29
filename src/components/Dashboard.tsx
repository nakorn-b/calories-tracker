import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { FoodItem } from "../types";

interface DashboardProps {
  totalCalories: number;
  calorieGoal: number;
  totalProtein: number;
  proteinGoal: number;
  recentMeals: FoodItem[];
  weeklyData: { day: string; calories: number; protein: number; isToday?: boolean }[];
}

export function Dashboard({
  totalCalories,
  calorieGoal,
  totalProtein,
  proteinGoal,
  recentMeals,
  weeklyData,
}: DashboardProps) {
  const calorieProgress = (totalCalories / calorieGoal) * 100;
  const proteinProgress = (totalProtein / proteinGoal) * 100;

  // Claude-inspired colors
  const PRIMARY_COLOR = "#d97757"; // Orange
  const SECONDARY_COLOR = "#40b3a2"; // Teal

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-container-highest p-3 rounded-2xl border border-outline shadow-2xl backdrop-blur-md">
          <p className="font-headline text-[11px] font-bold text-on-surface mb-2 uppercase tracking-widest">{payload[0].payload.day}</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              <p className="text-[10px] text-on-surface font-medium">
                {payload[0].value} kcal
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
              <p className="text-[10px] text-on-surface font-medium">
                {payload[1].value} g protein
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Stats Section */}
      <section className="mt-6 space-y-4">
        {/* Large Calorie Card */}
        <div className="relative bg-surface-container rounded-[2rem] p-6 sm:p-8 border border-outline overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-primary/10"></div>
          
          <div className="relative z-10 flex justify-between items-end">
            <div className="space-y-1">
              <p className="font-label text-on-surface-variant text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold">Energy Consumed</p>
              <div className="flex items-baseline gap-2">
                <h2 className="font-headline text-4xl sm:text-5xl font-black text-on-surface tracking-tighter">
                  {totalCalories.toLocaleString()}
                </h2>
                <span className="text-sm text-on-surface-variant font-bold">kcal</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] sm:text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Daily Goal</p>
              <p className="font-headline text-base sm:text-lg font-bold text-on-surface">{calorieGoal}</p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Progress</span>
              <span className="text-[10px] font-black text-primary">{Math.round(calorieProgress)}%</span>
            </div>
            <div className="h-2.5 bg-background rounded-full p-0.5 border border-outline">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(217,119,87,0.4)]"
                style={{ width: `${Math.min(calorieProgress, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Protein Secondary Card - Wide & Slim */}
        <div className="bg-surface-container rounded-3xl p-6 border border-outline flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20 transition-all group-hover:bg-secondary/20">
              <span className="material-symbols-outlined text-secondary font-bold">fitness_center</span>
            </div>
            <div>
              <p className="font-label text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">Protein Intake</p>
              <div className="flex items-baseline gap-1">
                <span className="font-headline text-2xl font-black text-secondary tracking-tighter">{totalProtein}</span>
                <span className="text-[10px] text-on-surface-variant font-bold">/ {proteinGoal}g</span>
              </div>
            </div>
          </div>
          
          <div className="w-24 h-1.5 bg-background rounded-full overflow-hidden border border-outline">
            <div
              className="h-full bg-secondary rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(64,179,162,0.3)]"
              style={{ width: `${Math.min(proteinProgress, 100)}%` }}
            ></div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex justify-between items-center px-1">
          <h2 className="font-headline text-sm font-bold text-on-surface uppercase tracking-widest">Weekly Activity</h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest">Kcal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
              <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest">Protein</span>
            </div>
          </div>
        </div>
        <div className="bg-surface-container rounded-[2rem] p-4 sm:p-6 border border-outline h-48 sm:h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 0, right: 5, left: 5, bottom: 0 }}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 8, fontWeight: 600 }}
                dy={10}
                interval={0}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar
                dataKey="calories"
                fill={PRIMARY_COLOR}
                radius={[2, 2, 0, 0]}
                barSize={10}
              >
                {weeklyData.map((entry: any, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isToday ? PRIMARY_COLOR : `${PRIMARY_COLOR}33`}
                  />
                ))}
              </Bar>
              <Bar
                dataKey="protein"
                fill={SECONDARY_COLOR}
                radius={[2, 2, 0, 0]}
                barSize={10}
              >
                {weeklyData.map((entry: any, index) => (
                  <Cell
                    key={`cell-p-${index}`}
                    fill={entry.isToday ? SECONDARY_COLOR : `${SECONDARY_COLOR}33`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="space-y-4 pb-10">
        <div className="flex justify-between items-center px-1">
          <h2 className="font-headline text-sm font-bold text-on-surface uppercase tracking-widest">Recent</h2>
          <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:opacity-70 transition-opacity">
            View Log
          </button>
        </div>
        <div className="space-y-3">
          {recentMeals.map((meal) => (
            <div
              key={meal.id}
              className="bg-surface-container rounded-2xl p-4 flex items-center justify-between group hover:bg-surface-bright transition-all duration-200 cursor-pointer border border-outline hover:border-primary/20"
            >
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{meal.name}</h3>
                <p className="text-[10px] text-on-surface-variant mt-1 font-medium">
                  {meal.time} • {meal.category}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-on-surface">+{meal.calories}</p>
                <p className="text-[10px] text-on-surface-variant font-medium">kcal</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
