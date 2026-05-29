export type View = "dashboard" | "log" | "add" | "coach" | "settings";

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  time: string;
  date: string; // ISO format (YYYY-MM-DD)
  category: "Breakfast" | "Lunch" | "Dinner" | "Snack";
}

export interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  time: string;
}

export interface User {
  id: number;
  username: string;
  weight: number;
  target_calories: number;
  target_protein: number;
  tdee: number;
  bmr: number;
}
