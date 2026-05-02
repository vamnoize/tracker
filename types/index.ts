export interface Profile {
  id: string
  email: string | null
  name: string | null
  avatar_url: string | null
  daily_calorie_limit: number
  daily_protein_limit: number
  created_at: string
  updated_at: string
}

export interface FoodItem {
  name: string
  portion: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface MealLog {
  id: string
  user_id: string
  image_url: string | null
  food_items: FoodItem[]
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  analysis_text: string | null
  logged_at: string
  created_at: string
}

export interface NutritionAnalysis {
  food_items: FoodItem[]
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  analysis_text: string
}

export interface DailySummary {
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  meal_count: number
}
