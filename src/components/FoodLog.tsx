import React, { useState } from "react";
import type { FoodItem } from "../types";
import { Modal } from "./Modal";

interface FoodLogProps {
  foodLog: FoodItem[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<FoodItem>) => void;
}

export function FoodLog({ foodLog, onDelete, onUpdate }: FoodLogProps) {
  const [itemToDelete, setItemToDelete] = useState<FoodItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<{
    name: string;
    calories: number;
    protein: number;
    category: FoodItem["category"];
  }>({
    name: "",
    calories: 0,
    protein: 0,
    category: "Lunch"
  });

  const startEditing = (item: FoodItem) => {
    setEditingId(item.id);
    setEditFields({
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      category: item.category
    });
  };

  const handleSaveEdit = (id: string) => {
    onUpdate(id, editFields);
    setEditingId(null);
  };

  // Group foods by date
  const groupedByDate = foodLog.reduce((groups, item) => {
    const date = item.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, FoodItem[]>);

  // Sort dates descending (newest first)
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const formatDisplayDate = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    
    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";
    
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-16 py-8 duration-500 animate-in fade-in slide-in-from-bottom-5">
      <Modal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) {
            onDelete(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        title="Delete Entry?"
        message={`Are you sure you want to remove "${itemToDelete?.name}" from your log? This cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />

      {sortedDates.length === 0 ? (
        <div className="py-24 text-center">
          <div className="w-20 h-20 bg-surface-container rounded-3xl flex items-center justify-center mx-auto mb-6 border border-outline">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">history_edu</span>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">Your journal is empty</p>
          <p className="text-sm text-on-surface-variant mt-2 max-w-[240px] mx-auto">Start logging your meals to see your nutrition history here.</p>
        </div>
      ) : (
        sortedDates.map((date) => {
          const items = (groupedByDate[date] || []).sort((a, b) => b.time.localeCompare(a.time));
          const dailyCalories = items.reduce((sum, i) => sum + i.calories, 0);
          const dailyProtein = items.reduce((sum, i) => sum + i.protein, 0);

          return (
            <section key={date} className="relative space-y-6">
              {/* Date Card Header */}
              <div className="bg-surface-container rounded-[2.5rem] p-6 sm:p-8 border border-outline shadow-sm">
                <div className="flex justify-between items-start mb-6 gap-4">
                  <div>
                    <h2 className="font-headline text-2xl sm:text-3xl font-black text-on-surface tracking-tighter leading-tight">
                      {formatDisplayDate(date)}
                    </h2>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-[0.2em] mt-2">
                      {date === new Date().toISOString().split("T")[0] ? "Current Day" : "Log History"}
                    </p>
                  </div>
                  <div className="bg-background/50 rounded-2xl px-3 py-1.5 border border-outline flex-shrink-0 shadow-inner flex items-center justify-center">
                    <span className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest whitespace-nowrap leading-none">
                      {items.length} {items.length === 1 ? 'Entry' : 'Entries'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-background/40 rounded-3xl p-4 border border-outline flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <span className="material-symbols-outlined text-sm text-primary">local_fire_department</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-on-surface-variant font-black uppercase tracking-widest leading-none mb-1">Energy</span>
                      <div className="flex items-baseline gap-1">
                        <span className="font-headline font-bold text-lg text-on-surface">{dailyCalories}</span>
                        <span className="text-[10px] text-on-surface-variant">kcal</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-background/40 rounded-3xl p-4 border border-outline flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20">
                      <span className="material-symbols-outlined text-sm text-secondary">fitness_center</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-on-surface-variant font-black uppercase tracking-widest leading-none mb-1">Protein</span>
                      <div className="flex items-baseline gap-1">
                        <span className="font-headline font-bold text-lg text-on-surface">{dailyProtein}</span>
                        <span className="text-[10px] text-on-surface-variant">g</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4 px-2">
                {items.map((item) => {
                  const isEditing = editingId === item.id;
                  
                  if (isEditing) {
                    return (
                      <div key={item.id} className="bg-surface-container rounded-[2rem] p-6 border border-primary/30 shadow-lg animate-in zoom-in-95 duration-200">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Food Name</label>
                              <input 
                                type="text"
                                className="w-full bg-background border border-outline-variant/30 rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                value={editFields.name}
                                onChange={(e) => setEditFields({ ...editFields, name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Category</label>
                              <select 
                                className="w-full bg-background border border-outline-variant/30 rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none"
                                value={editFields.category}
                                onChange={(e) => setEditFields({ ...editFields, category: e.target.value as any })}
                              >
                                {["Breakfast", "Lunch", "Dinner", "Snack"].map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Calories (kcal)</label>
                              <input 
                                type="number"
                                className="w-full bg-background border border-outline-variant/30 rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                value={editFields.calories}
                                onChange={(e) => setEditFields({ ...editFields, calories: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Protein (g)</label>
                              <input 
                                type="number"
                                className="w-full bg-background border border-outline-variant/30 rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                value={editFields.protein}
                                onChange={(e) => setEditFields({ ...editFields, protein: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                            <button 
                              onClick={() => handleSaveEdit(item.id)}
                              className="flex-1 bg-primary text-on-primary font-bold py-2.5 rounded-xl text-xs shadow-md hover:brightness-110 transition-all active:scale-[0.98]"
                            >
                              Save Changes
                            </button>
                            <button 
                              onClick={() => setEditingId(null)}
                              className="px-4 bg-surface-container-highest text-on-surface-variant font-bold py-2.5 rounded-xl text-xs hover:text-on-surface transition-all active:scale-[0.98]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className="group bg-surface-container-low rounded-[2rem] p-5 flex items-center justify-between hover:bg-surface-container transition-all duration-300 border border-outline hover:border-primary/30"
                    >
                      <div className="flex items-center gap-5 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors border border-outline">
                          <span className="material-symbols-outlined">
                            {item.category === "Breakfast" ? "wb_twilight" : 
                             item.category === "Lunch" ? "wb_sunny" : 
                             item.category === "Dinner" ? "dark_mode" : "cookie"}
                          </span>
                        </div>
                        
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                              {item.time}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">
                              {item.category}
                            </span>
                          </div>
                          <h3 className="font-headline font-bold text-base text-on-surface">
                            {item.name}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-baseline gap-1 justify-end">
                            <span className="font-headline font-black text-lg text-on-surface">{item.calories}</span>
                            <span className="text-[10px] text-on-surface-variant font-bold">kcal</span>
                          </div>
                          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">
                            {item.protein}g protein
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditing(item)}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all active:scale-90"
                            title="Edit entry"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-all active:scale-90"
                            title="Delete entry"
                          >
                            <span className="material-symbols-outlined text-lg">close</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
