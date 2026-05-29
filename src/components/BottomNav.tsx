import React from "react";
import type { View } from "../types";

interface BottomNavProps {
  activeView: View;
  setView: (v: View) => void;
}

export function BottomNav({ activeView, setView }: BottomNavProps) {
  const items: { id: View; label: string; icon: string }[] = [
    { id: "dashboard", label: "Home", icon: "dashboard" },
    { id: "log", label: "Log", icon: "description" },
    { id: "coach", label: "Trends", icon: "insights" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center pt-3 pb-8 px-4 bg-surface border-t border-outline shadow-[0_-1px_10px_rgba(0,0,0,0.5)]">
      {items.slice(0, 2).map((item) => (
        <button
          key={item.id}
          onClick={() => setView(item.id)}
          className={`flex flex-col items-center justify-center transition-all active:scale-90 ${
            activeView === item.id ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined mb-1 text-[22px]" style={{ fontVariationSettings: activeView === item.id ? "'FILL' 1" : "" }}>
            {item.icon}
          </span>
          <span className="font-headline text-[9px] font-bold tracking-widest uppercase">{item.label}</span>
        </button>
      ))}

      <button
        onClick={() => setView("add")}
        className="w-12 h-12 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all shadow-primary/10 hover:brightness-110"
      >
        <span className="material-symbols-outlined text-2xl font-bold">add</span>
      </button>

      {items.slice(2).map((item) => (
        <button
          key={item.id}
          onClick={() => setView(item.id)}
          className={`flex flex-col items-center justify-center transition-all active:scale-90 ${
            activeView === item.id ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined mb-1 text-[22px]" style={{ fontVariationSettings: activeView === item.id ? "'FILL' 1" : "" }}>
            {item.icon}
          </span>
          <span className="font-headline text-[9px] font-bold tracking-widest uppercase">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
