import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface NutritionAnalysis {
  food_items: {
    name: string
    portion: string
    calories: number
    protein: number
    carbs: number
    fat: number
  }[]
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  analysis_text: string
}

export async function analyzeFoodImage(imageUrl: string): Promise<NutritionAnalysis> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'url', url: imageUrl },
          },
          {
            type: 'text',
            text: `วิเคราะห์อาหารในรูปนี้ ให้ประมาณปริมาณและคุณค่าสารอาหาร ตอบเป็น JSON format ดังนี้:
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
          },
        ],
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonText = content.text.trim()
  return JSON.parse(jsonText)
}
