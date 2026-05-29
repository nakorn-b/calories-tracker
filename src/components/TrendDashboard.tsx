import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import type { FoodItem } from "../types";
import { useUserStore } from "../zustand";

interface TrendDashboardProps {
  foodLog: FoodItem[];
}

type WindowType = "week" | "month";

export function TrendDashboard({ foodLog }: TrendDashboardProps) {
  const [window, setWindow] = useState<WindowType>("week");
  const user = useUserStore((state) => state.user);

  const data = useMemo(() => {
    const now = new Date();
    const result = [];
    const daysToShow = window === "week" ? 7 : 30;

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      
      const dayItems = foodLog.filter((item) => item.date === iso);
      const calories = dayItems.reduce((sum, item) => sum + item.calories, 0);
      const protein = dayItems.reduce((sum, item) => sum + item.protein, 0);

      result.push({
        date: iso,
        displayDate: window === "week" 
          ? d.toLocaleDateString(undefined, { weekday: 'short' })
          : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
        calories,
        protein,
        isToday: iso === now.toISOString().split("T")[0]
      });
    }
    return result;
  }, [foodLog, window]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-container-high border border-outline-variant p-3 rounded-xl shadow-xl">
          <p className="text-xs font-bold text-on-surface-variant mb-2">{label}</p>
          <div className="space-y-2">
            {payload.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium" style={{ color: item.color }}>
                  {item.name || item.dataKey === 'calories' ? 'Calories' : 'Protein'}:
                </span>
                <span className="text-sm font-bold text-on-surface">
                  {item.value}{item.dataKey === 'calories' ? ' kcal' : 'g'}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline font-extrabold text-2xl text-on-surface">Consumption Trends</h2>
          <p className="text-sm text-on-surface-variant">Your progress over time</p>
        </div>
        <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/30">
          <button
            onClick={() => setWindow("week")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              window === "week"
                ? "bg-primary text-on-primary shadow-md"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            WEEK
          </button>
          <button
            onClick={() => setWindow("month")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              window === "month"
                ? "bg-primary text-on-primary shadow-md"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            MONTH
          </button>
        </div>
      </div>

      {/* Calories Chart */}
      <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/10 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-on-surface">Daily Calories</h3>
          <div className="text-xs text-on-surface-variant flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            Target: {user?.target_calories || 2400} kcal
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#444" opacity={0.1} />
              <XAxis 
                dataKey="displayDate" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10 }}
                interval={window === "week" ? 0 : 5}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={user?.target_calories || 2400} stroke="var(--color-primary)" strokeDasharray="5 5" opacity={0.5} />
              <Area 
                type="monotone" 
                dataKey="calories" 
                stroke="var(--color-primary)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCalories)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Protein Chart */}
      <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/10 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-on-surface">Daily Protein</h3>
          <div className="text-xs text-on-surface-variant flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-secondary"></div>
            Target: {user?.target_protein || 150}g
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProtein" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#444" opacity={0.1} />
              <XAxis 
                dataKey="displayDate" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10 }}
                interval={window === "week" ? 0 : 5}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={user?.target_protein || 150} stroke="var(--color-secondary)" strokeDasharray="5 5" opacity={0.5} />
              <Area 
                type="monotone" 
                dataKey="protein" 
                stroke="var(--color-secondary)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorProtein)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
