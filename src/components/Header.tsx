import React from "react";
import { test } from "../services/foodService"
import { useUserStore } from "../zustand";

export function Header() {
  const user = useUserStore((state) => state.user)
  return (
    <header className="fixed top-0 left-0 w-full z-50 glass-header flex justify-between items-center px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center overflow-hidden border border-outline shadow-sm">
          <img
            src="https://www.jammable.com/cdn-cgi/image/width=640,quality=75,format=webp/https://images.jammable.com/voices/445c35df-1960-4396-aee5-bdfc3d3cbbd7.png"
            alt="Profile"
            className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-300"
            onClick={test}
          />
        </div>
        <h1 className="text-lg font-bold text-on-surface font-headline tracking-tight">Mr. {user?.username}</h1>
      </div>
    </header>
  );
}
