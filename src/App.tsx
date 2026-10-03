import React, { useState, useEffect } from "react";
import "./index.css";
import type { View, FoodItem, Message, User } from "./types";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { Dashboard } from "./components/Dashboard";
import { MealDiary } from "./components/MealDiary";
import { AddFood } from "./components/AddFood";
import { Coach } from "./components/Coach";
import { TrendDashboard } from "./components/TrendDashboard";
import { Settings } from "./components/Settings";
import { FoodCardList } from "./components/FoodCardList";
import { LogFoodSheet } from "./components/LogFoodSheet";
import { ChatLogSheet } from "./components/ChatLogSheet";
import { Login } from "./components/Login";
import { getAIResponse, getAIResponseFromImage, parseFoodItemsFromAIResponse, normalizeCategory } from "./services/aiService";
import { getFoodLog, deleteFood, updateFood, checkAuth, loginUser, logoutUser, logMeal } from "./services/foodService";
import { getUser, updateUserTargets } from "./services/userService";
import { useUserStore } from "./zustand";

const getTodayISO = () => new Date().toISOString().split("T")[0];

const MAX_PHOTO_DIMENSION = 1280;

/** Downscales a photo to a JPEG and returns its base64 data, keeping uploads under the API's request size limit. */
const fileToBase64 = async (file: File): Promise<string> => {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85).split(",")[1]!;
};

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
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [detectedFoods, setDetectedFoods] = useState<FoodItem[]>([]);
  const [showDetectionModal, setShowDetectionModal] = useState(false);
  const [presetCategory, setPresetCategory] = useState<FoodItem["category"] | undefined>(undefined);
  const [showLogSheet, setShowLogSheet] = useState(false);
  const [logSheetCategory, setLogSheetCategory] = useState<FoodItem["category"] | undefined>(undefined);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [showChatSheet, setShowChatSheet] = useState(false);
  const [isChatSending, setIsChatSending] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ item: FoodItem; timeoutId: ReturnType<typeof setTimeout> } | null>(null);
  const setUser = useUserStore((state) => state.setUser);
  const user = useUserStore((state) => state.user)

  // Clear any in-flight undo timer if the app unmounts mid-window.
  useEffect(() => {
    return () => {
      if (pendingDelete) clearTimeout(pendingDelete.timeoutId);
    };
  }, [pendingDelete]);

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
  const totalCarbs = todayItems.reduce((sum, item) => sum + (item.carbs ?? 0), 0);
  const totalFat = todayItems.reduce((sum, item) => sum + (item.fat ?? 0), 0);

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
      setPresetCategory(undefined);
      setView("diary");
    } catch (err) {
      console.error("Failed to add food:", err);
      alert("Failed to save food log entry.");
    }
  };

  const handleQuickLog = async (newItem: Omit<FoodItem, "id">) => {
    try {
      const savedItem = await logMeal(newItem);
      setFoodLog(prev => [savedItem, ...prev]);
    } catch (err) {
      console.error("Failed to quick log food:", err);
      throw err;
    }
  };

  const handleDeleteFood = (id: string) => {
    const item = foodLog.find((f) => f.id === id);
    if (!item) return;

    // Optimistically hide it immediately; the actual delete only commits
    // after the undo window closes, so a mis-tap is always recoverable.
    setFoodLog((prev) => prev.filter((f) => f.id !== id));

    setPendingDelete((current) => {
      if (current) {
        clearTimeout(current.timeoutId);
        deleteFood(current.item.id).catch((err) =>
          console.error("Failed to delete food:", err)
        );
      }

      const timeoutId = setTimeout(async () => {
        try {
          await deleteFood(id);
        } catch (err) {
          console.error("Failed to delete food:", err);
          setFoodLog((prev) => [item, ...prev]);
        } finally {
          setPendingDelete((c) => (c?.item.id === id ? null : c));
        }
      }, 5000);

      return { item, timeoutId };
    });
  };

  const handleUndoDelete = () => {
    setPendingDelete((current) => {
      if (!current) return null;
      clearTimeout(current.timeoutId);
      setFoodLog((prev) => [current.item, ...prev]);
      return null;
    });
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

  const openLogSheet = (category?: FoodItem["category"]) => {
    setLogSheetCategory(category);
    setShowLogSheet(true);
  };

  const handleManualEntry = () => {
    setPresetCategory(logSheetCategory);
    setShowLogSheet(false);
    setView("add");
  };

  const handleOpenChat = () => {
    setShowLogSheet(false);
    setShowChatSheet(true);
  };

  const handlePhotoCapture = async (file: File) => {
    setIsAnalyzingPhoto(true);
    try {
      const base64Data = await fileToBase64(file);
      const responseText = await getAIResponseFromImage(base64Data, "image/jpeg");
      const foodItems = responseText ? parseFoodItemsFromAIResponse(responseText) : null;

      if (!foodItems || foodItems.length === 0) {
        alert("Couldn't detect any food in that photo. Try another angle or fill it in manually.");
        return;
      }

      const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setDetectedFoods(foodItems.map((item: any, idx: number) => ({
        id: item.id || `detected-${Date.now()}-${idx}`,
        name: item.name || "Unknown Food",
        calories: parseInt(item.calories) || 0,
        protein: parseInt(item.protein) || 0,
        carbs: item.carbs != null ? parseInt(item.carbs) || 0 : null,
        fat: item.fat != null ? parseInt(item.fat) || 0 : null,
        category: logSheetCategory || normalizeCategory(item.category),
        date: selectedDate,
        time: currentTime,
      })) as FoodItem[]);
      setShowDetectionModal(true);
      setShowLogSheet(false);
    } catch (err) {
      console.error("Failed to analyze photo:", err);
      alert("Failed to analyze photo. Please try again or fill it in manually.");
    } finally {
      setIsAnalyzingPhoto(false);
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
    setIsChatSending(true);

    try {
      const responseText = await getAIResponse(userMsg.text);
      const isJson = responseText?.trim().startsWith('[') || responseText?.trim().startsWith('{');
      const AIMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: isJson
          ? "I've detected some food items from your message. Review them below!"
          : `⚠️ ${responseText || "I'm not exactly sure how to help with that."}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, AIMsg]);

      if (responseText) {
        const foodItems = parseFoodItemsFromAIResponse(responseText);
        if (foodItems && foodItems.length > 0) {
          const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          setDetectedFoods(foodItems.map((item: any, idx: number) => ({
            id: item.id || `detected-${Date.now()}-${idx}`,
            name: item.name || "Unknown Food",
            calories: parseInt(item.calories) || 0,
            protein: parseInt(item.protein) || 0,
            carbs: item.carbs != null ? parseInt(item.carbs) || 0 : null,
            fat: item.fat != null ? parseInt(item.fat) || 0 : null,
            category: normalizeCategory(item.category),
            date: getTodayISO(),
            time: currentTime
          })) as FoodItem[]);
          setShowDetectionModal(true);
        }
      }
    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 2).toString(),
        role: "bot",
        text: "⚠️ Something went wrong reaching the nutrition assistant. Please try again.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    } finally {
      setIsChatSending(false);
    }
  };

  const handleUpdateGoals = async (calories: number, protein: number, carbs: number, fat: number) => {
    try {
      const updatedUser = await updateUserTargets({
        target_calories: calories,
        target_protein: protein,
        target_carbs: carbs,
        target_fat: fat,
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
            totalCarbs={totalCarbs}
            carbsGoal={user.target_carbs}
            totalFat={totalFat}
            fatGoal={user.target_fat}
            recentMeals={todayItems.slice(0, 3)}
            weeklyData={calculateWeeklyData()}
            onQuickLog={handleQuickLog}
            foodLog={foodLog}
            onDeleteFood={handleDeleteFood}
            onUpdateFood={handleUpdateFood}
            onViewLog={() => setView("diary")}
          />
        )}
        {view === "diary" && (
          <MealDiary
            foodLog={foodLog}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onDelete={handleDeleteFood}
            onUpdate={handleUpdateFood}
            onAddFood={(category) => openLogSheet(category)}
          />
        )}

        {view === "add" && (
          <AddFood
            onSave={handleAddFood}
            onCancel={() => {
              setPresetCategory(undefined);
              setView("dashboard");
            }}
            initialCategory={presetCategory}
            initialDate={selectedDate}
          />
        )}
        {view === "coach" && <TrendDashboard foodLog={foodLog} />}
        {view === "settings" && (
          <Settings
            calorieGoal={user.target_calories}
            proteinGoal={user.target_protein}
            carbsGoal={user.target_carbs}
            fatGoal={user.target_fat}
            foodLog={foodLog}
            onUpdateGoals={handleUpdateGoals}
            onLogout={handleLogout}
          />
        )}
      </main>

      {pendingDelete && (
        <div className="fixed inset-x-0 bottom-24 z-toast flex justify-center px-6 pointer-events-none" role="status">
          <div className="pointer-events-auto flex items-center gap-4 max-w-full bg-surface-container-highest border border-outline rounded-2xl pl-5 pr-3 py-3 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300">
            <span className="text-body-sm text-on-surface font-medium truncate">
              "{pendingDelete.item.name}" removed
            </span>
            <button
              onClick={handleUndoDelete}
              className="shrink-0 text-label font-bold text-primary uppercase tracking-widest hover:opacity-70 transition-opacity cursor-pointer px-2 py-1"
            >
              Undo
            </button>
          </div>
        </div>
      )}

      <BottomNav activeView={view} setView={setView} onLogFoodClick={() => openLogSheet()} />

      <LogFoodSheet
        isOpen={showLogSheet}
        onClose={() => setShowLogSheet(false)}
        onManual={handleManualEntry}
        onChat={handleOpenChat}
        onImageSelected={handlePhotoCapture}
        isProcessing={isAnalyzingPhoto}
      />

      <ChatLogSheet
        isOpen={showChatSheet}
        onClose={() => setShowChatSheet(false)}
        messages={messages}
        onSend={handleSendMessage}
        isSending={isChatSending}
      />

      {showDetectionModal && (
        <FoodCardList
          initialFoods={detectedFoods}
          onClose={() => setShowDetectionModal(false)}
          onLogged={(item) => setFoodLog(prev => [item, ...prev])}
          title="AI Food Detection"
        />
      )}
    </div>
  );
}

export default App;
