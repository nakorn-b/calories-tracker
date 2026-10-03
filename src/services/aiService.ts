import { post } from "./api";

const VALID_CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;

const GENERIC_ERROR = "Something went wrong talking to the nutrition assistant. Please try again.";

/** Coerces whatever category string the model returns into one of the app's fixed categories, defaulting to "Snack". */
export function normalizeCategory(category: unknown): "Breakfast" | "Lunch" | "Dinner" | "Snack" {
  const match = VALID_CATEGORIES.find((c) => c.toLowerCase() === String(category).trim().toLowerCase());
  return match || "Snack";
}

/** Asks the backend's /ai/analyze endpoint, which holds the Gemini key. Throws with a user-facing message on failure. */
async function analyzeFood(payload: Record<string, unknown>): Promise<string> {
  const { text } = await post("/ai/analyze", { ...payload, today: new Date().toLocaleDateString() });
  return text ?? "";
}

export async function getAIResponse(prompt: string) {
  try {
    return await analyzeFood({ type: "text", prompt });
  } catch (error) {
    console.error("Gemini Error:", error);
    return error instanceof Error && !error.message.startsWith("API error") ? error.message : GENERIC_ERROR;
  }
}

export async function getAIResponseFromImage(base64Data: string, mimeType: string) {
  try {
    return await analyzeFood({ type: "image", data: base64Data, mime_type: mimeType });
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return null;
  }
}

/** Parses a Gemini food-detection response into raw item objects, tolerating responses that aren't pure JSON. */
export function parseFoodItemsFromAIResponse(responseText: string): any[] | null {
  try {
    const parsed = JSON.parse(responseText.trim());
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s) || responseText.match(/\{\s*".*\}\s*/s);
    if (jsonMatch) {
      try {
        const rawJson = jsonMatch[0].replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(rawJson);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (innerE) {
        console.error("Failed to parse JSON from AI response:", innerE);
        return null;
      }
    }
    return null;
  }
}
