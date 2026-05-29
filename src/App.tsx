import React, { useState, useEffect } from "react";
import "./index.css";
import type { View, FoodItem, Message, User } from "./types";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { Dashboard } from "./components/Dashboard";
import { FoodLog } from "./components/FoodLog";
import { AddFood } from "./components/AddFood";
import { Coach } from "./components/Coach";
import { TrendDashboard } from "./components/TrendDashboard";
import { Settings } from "./components/Settings";
import { FoodCardList } from "./components/FoodCardList";
import { Login } from "./components/Login";
import { GoogleGenAI } from '@google/genai';
import { getFoodLog, deleteFood, updateFood, checkAuth, loginUser, logoutUser } from "./services/foodService";
import { getUser, updateUserTargets } from "./services/userService";
import { useUserStore } from "./zustand";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

async function getAIResponse(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are a nutrition expert. Today is ${new Date().toLocaleDateString()}. Your task is to read the user's message and extract the food items they consumed and give me the calories and protein content of each item. Respond with a JSON array of food items in the format: [{ "name": "Food Name", "calories": 0, "protein": 0, "category": "Category", "date": "YYYY-MM-DD", "time": "HH:MM AM/PM" }]. Do not include any other text.`,
        responseSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              calories: { type: "number" },
              protein: { type: "number" },
              category: { type: "string" },
              date: { type: "string" },
              time: { type: "string" }
            },
            required: ["name", "calories", "protein", "category"]
          }
        },
        responseMimeType: "application/json"
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error communicating with AI Assistant.";
  }
}

const getTodayISO = () => new Date().toISOString().split("T")[0];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "bot",
    text: "Hello! I'm your Nutrition Assistant. How can I help you today?",
    time: "10:00 AM",
  },
];

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [view, setView] = useState<View>("dashboard");
  const [foodLog, setFoodLog] = useState<FoodItem[]>([]);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [detectedFoods, setDetectedFoods] = useState<FoodItem[]>([]);
  const [showDetectionModal, setShowDetectionModal] = useState(false);
  const setUser = useUserStore((state) => state.setUser);
  const user = useUserStore((state) => state.user)

  // Check auth on mount
  useEffect(() => {
    const checkSession = async () => {
      const savedToken = localStorage.getItem('calories_tracker_token');
      if (!savedToken) {
        setIsAuthChecked(true);
        return;
      }
      
      try {
        const res = await checkAuth();
        if (res.authenticated) {
          setIsAuthenticated(true);
          await Promise.all([fetchFoods(), fetchUser()]);
        } else {
          localStorage.removeItem('calories_tracker_token');
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setIsAuthChecked(true);
      }
    };
    checkSession();
  }, []);

  const fetchFoods = async () => {
    try {
      const data = await getFoodLog();
      setFoodLog(data || []);
    } catch (err) {
      console.error("Failed to fetch food log:", err);
      if ((err as Error).message.includes("Not authenticated")) {
        setIsAuthenticated(false);
        localStorage.removeItem('calories_tracker_token');
      }
    }
  };

  const fetchUser = async () => {
    try {
        const user: User = await getUser();
        setUser(user);
        console.log(user)
    } catch (err) {
      console.error("Failed to fetch user:", err)
    }

  }

  const handleLogin = async (password: string) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const res = await loginUser(password);
      console.log("Login Response Data:", res);
      if (res && res.token) {
        localStorage.setItem('calories_tracker_token', res.token);
        setIsAuthenticated(true);
        console.log("Login successful, fetching foods...");
        await fetchFoods();
        await fetchUser();
      } else {
        console.error("Login response invalid or missing token. Full response:", res);
        throw new Error("Invalid server response: missing token");
      }
    } catch (err) {
      setAuthError((err as Error).message || "Invalid password. Please try again.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsAuthenticated(false);
      localStorage.removeItem('calories_tracker_token');
      setFoodLog([]);
    }
  };

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} isLoading={isAuthLoading} error={authError} />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span>
          <p className="text-on-surface-variant animate-pulse font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const todayISO = getTodayISO();
  const todayItems = foodLog.filter((item) => item.date === todayISO);
  const totalCalories = todayItems.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = todayItems.reduce((sum, item) => sum + item.protein, 0);

  const calculateWeeklyData = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const result = [];
    
    // Find the Monday of the current week
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
    // Adjust so Monday is 0, Sunday is 6
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const dayItems = foodLog.filter((item) => item.date === iso);
      const dayCalories = dayItems.reduce((sum, item) => sum + item.calories, 0);
      const dayProtein = dayItems.reduce((sum, item) => sum + item.protein, 0);
      
      result.push({
        day: days[i],
        calories: dayCalories,
        protein: dayProtein,
        isToday: iso === getTodayISO()
      });
    }
    return result;
  };

  const handleAddFood = async (newItem: Omit<FoodItem, "id">) => {
    try {
      const savedItem = await logMeal(newItem);
      setFoodLog(prev => [savedItem, ...prev]);
      setView("log");
    } catch (err) {
      console.error("Failed to add food:", err);
      alert("Failed to save food log entry.");
    }
  };

  const handleDeleteFood = async (id: string) => {
    try {
      await deleteFood(id);
      setFoodLog(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Failed to delete food:", err);
      alert("Failed to delete food log entry.");
    }
  };

  const handleUpdateFood = async (id: string, updates: Partial<FoodItem>) => {
    try {
      const updatedItem = await updateFood(id, updates);
      setFoodLog(prev => prev.map(item => item.id === id ? { ...item, ...updatedItem } : item));
    } catch (err) {
      console.error("Failed to update food:", err);
      alert("Failed to update food log entry.");
    }
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const responseText = await getAIResponse(userMsg.text);
      const isJson = responseText?.trim().startsWith('[') || responseText?.trim().startsWith('{');
      const AIMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: isJson ? "I've detected some food items from your message. Review them below!" : (responseText || "I'm not exactly sure how to help with that."),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, AIMsg]);

      if (responseText) {
        try {
          const parsed = JSON.parse(responseText.trim());
          const foodItems = Array.isArray(parsed) ? parsed : [parsed];
          
          if (foodItems.length > 0) {
            const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            setDetectedFoods(foodItems.map((item: any, idx: number) => ({
              id: item.id || `detected-${Date.now()}-${idx}`,
              name: item.name || "Unknown Food",
              calories: parseInt(item.calories) || 0,
              protein: parseInt(item.protein) || 0,
              category: item.category || "Snack",
              date: getTodayISO(),
              time: currentTime
            })) as FoodItem[]);
            setShowDetectionModal(true);
          }
        } catch (e) {
          console.log("Response text was not pure JSON, trying regex fallback...");
          const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s) || responseText.match(/\{\s*".*\}\s*/s);
          if (jsonMatch) {
            try {
              const rawJson = jsonMatch[0].replace(/```json|```/g, '').trim();
              const parsed = JSON.parse(rawJson);
              const foodItems = Array.isArray(parsed) ? parsed : [parsed];
              if (foodItems.length > 0) {
                const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                setDetectedFoods(foodItems.map((item: any, idx: number) => ({
                  id: item.id || `detected-${Date.now()}-${idx}`,
                  name: item.name || "Unknown Food",
                  calories: parseInt(item.calories) || 0,
                  protein: parseInt(item.protein) || 0,
                  category: item.category || "Snack",
                  date: getTodayISO(),
                  time: currentTime
                })) as FoodItem[]);
                setShowDetectionModal(true);
              }
            } catch (innerE) {
              console.error("Failed to parse JSON from AI response:", innerE);
            }
          }
        }
      }
    } catch (error) {
      console.error("AI Error:", error);
    }
  };

  const handleUpdateGoals = async (calories: number, protein: number) => {
    try {
      const updatedUser = await updateUserTargets({ 
        target_calories: calories, 
        target_protein: protein 
      });
      setUser(updatedUser);
      setView("dashboard");
    } catch (err) {
      console.error("Failed to update goals:", err);
      alert("Failed to save targets. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body pb-32">
      <Header />

      <main className="px-6 pt-20 max-w-2xl mx-auto">
        {view === "dashboard" && (
          <Dashboard
            totalCalories={totalCalories}
            calorieGoal={user.target_calories}
            totalProtein={totalProtein}
            proteinGoal={user.target_protein}
            recentMeals={todayItems.slice(0, 3)}
            weeklyData={calculateWeeklyData()}
          />
        )}
        {view === "log" && <FoodLog foodLog={foodLog} onDelete={handleDeleteFood} onUpdate={handleUpdateFood} />}

        {view === "add" && <AddFood onSave={handleAddFood} onCancel={() => setView("dashboard")} />}
        {view === "coach" && <TrendDashboard foodLog={foodLog} />}
        {view === "settings" && (
          <Settings
            calorieGoal={user.target_calories}
            proteinGoal={user.target_protein}
            foodLog={foodLog}
            onUpdateGoals={handleUpdateGoals}
            onLogout={handleLogout}
          />
        )}
      </main>

      <BottomNav activeView={view} setView={setView} />
      
      {showDetectionModal && (
        <FoodCardList 
          initialFoods={detectedFoods} 
          onClose={() => setShowDetectionModal(false)} 
          title="AI Food Detection"
        />
      )}
    </div>
  );
}

export default App;
