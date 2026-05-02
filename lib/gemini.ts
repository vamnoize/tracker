import { GoogleGenerativeAI } from '@google/generative-ai'
import { NutritionAnalysis } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

export async function analyzeFoodImage(base64Image: string): Promise<NutritionAnalysis> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

  // Strip data URL prefix if present (e.g. "data:image/jpeg;base64,")
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image
  const mimeMatch = base64Image.match(/data:(image\/[a-z]+);base64,/)
  const mimeType = (mimeMatch?.[1] ?? 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp'

  const result = await model.generateContent([
    {
      inlineData: { mimeType, data: base64Data },
    },
    `วิเคราะห์อาหารในรูปนี้ ให้ประมาณปริมาณและคุณค่าสารอาหาร ตอบเป็น JSON format ดังนี้:
{
  "food_items": [
    {
      "name": "ชื่ออาหาร",
      "portion": "ปริมาณโดยประมาณ",
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0
    }
  ],
  "total_calories": 0,
  "total_protein": 0,
  "total_carbs": 0,
  "total_fat": 0,
  "analysis_text": "สรุปสั้นๆ เกี่ยวกับมื้ออาหารนี้"
}

หน่วย: calories = kcal, protein/carbs/fat = กรัม
ตอบเฉพาะ JSON เท่านั้น ไม่ต้องมีข้อความอื่น`,
  ])

  const text = result.response.text().trim()
  const jsonText = text.startsWith('```') ? text.replace(/```json?\n?/g, '').replace(/```/g, '').trim() : text
  return JSON.parse(jsonText)
}
