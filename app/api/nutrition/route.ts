import { NextRequest, NextResponse } from 'next/server'

const FATSECRET_TOKEN_URL = 'https://oauth.fatsecret.com/connect/token'
const FATSECRET_SEARCH_URL = 'https://platform.fatsecret.com/rest/server.api'
const GEMINI_MODEL_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent'

type NutritionTotals = {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  sodium_mg: number
  labels: string[]
}

function sanitizeNutrition(data: Partial<NutritionTotals>): NutritionTotals {
  return {
    calories: Math.max(0, Math.round(Number(data.calories || 0))),
    protein_g: Math.max(0, Math.round(Number(data.protein_g || 0) * 10) / 10),
    carbs_g: Math.max(0, Math.round(Number(data.carbs_g || 0) * 10) / 10),
    fat_g: Math.max(0, Math.round(Number(data.fat_g || 0) * 10) / 10),
    fiber_g: Math.max(0, Math.round(Number(data.fiber_g || 0) * 10) / 10),
    sodium_mg: Math.max(0, Math.round(Number(data.sodium_mg || 0))),
    labels: Array.isArray(data.labels)
      ? data.labels.filter(Boolean).map(label => String(label).trim()).slice(0, 6)
      : [],
  }
}

function getFatSecretCredentials() {
  const clientId = process.env.FATSECRET_CLIENT_ID
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Missing FatSecret credentials')
  }

  return { clientId, clientSecret }
}

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY
}

function isFatSecretNetworkBlock(message: string) {
  return /invalid ip address/i.test(message)
}

async function getFatSecretToken() {
  const { clientId, clientSecret } = getFatSecretCredentials()
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(FATSECRET_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic',
  })

  const data = await res.json()
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Failed to get FatSecret token')
  }

  return data.access_token as string
}

async function estimateNutritionWithFatSecret(ingredients: string[]) {
  const token = await getFatSecretToken()

  const results = await Promise.all(
    ingredients.map(async ingredient => {
      const params = new URLSearchParams({
        method: 'foods.search',
        search_expression: ingredient,
        format: 'json',
        max_results: '1',
      })

      const res = await fetch(`${FATSECRET_SEARCH_URL}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || data.error || `Failed to search FatSecret for "${ingredient}"`)
      }

      const food = data.foods?.food
      const item = Array.isArray(food) ? food[0] : food
      if (!item) return null

      const desc = item.food_description || ''
      const calories = parseFloat(desc.match(/Calories:\s*([\d.]+)/i)?.[1] || '0')
      const fat = parseFloat(desc.match(/Fat:\s*([\d.]+)/i)?.[1] || '0')
      const carbs = parseFloat(desc.match(/Carbs:\s*([\d.]+)/i)?.[1] || '0')
      const protein = parseFloat(desc.match(/Protein:\s*([\d.]+)/i)?.[1] || '0')

      return { calories, fat, carbs, protein }
    })
  )

  const matched = results.filter(Boolean)
  if (matched.length === 0) {
    throw new Error('Could not match those ingredients in FatSecret. Try entries like "200g pasta" or "2 eggs".')
  }

  return sanitizeNutrition({
    calories: matched.reduce((sum, item) => sum + Number(item?.calories || 0), 0),
    protein_g: matched.reduce((sum, item) => sum + Number(item?.protein || 0), 0),
    carbs_g: matched.reduce((sum, item) => sum + Number(item?.carbs || 0), 0),
    fat_g: matched.reduce((sum, item) => sum + Number(item?.fat || 0), 0),
    fiber_g: 0,
    sodium_mg: 0,
    labels: [],
  })
}

async function estimateNutritionWithGemini(ingredients: string[]) {
  const apiKey = getGeminiApiKey()
  if (!apiKey) throw new Error('Missing Gemini API key')

  const res = await fetch(GEMINI_MODEL_URL, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: [
                'Estimate the total nutrition for this recipe ingredient list.',
                'Return values for the whole recipe, not per serving.',
                'If an ingredient lacks an amount, infer a conservative typical amount for one home-cooked recipe.',
                'Use grams for macros and milligrams for sodium.',
                'For labels, only use zero or more of: vegetarian, vegan, gluten-free, dairy-free, high-protein.',
                '',
                'Ingredients:',
                ...ingredients.map(ingredient => `- ${ingredient}`),
              ].join('\n'),
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          properties: {
            calories: { type: 'number' },
            protein_g: { type: 'number' },
            carbs_g: { type: 'number' },
            fat_g: { type: 'number' },
            fiber_g: { type: 'number' },
            sodium_mg: { type: 'number' },
            labels: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'high-protein'],
              },
            },
          },
          required: ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sodium_mg', 'labels'],
        },
      },
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error?.message || 'Failed to estimate nutrition with Gemini')
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned no nutrition data')

  return sanitizeNutrition(JSON.parse(text))
}

async function estimateNutrition(ingredients: string[]) {
  const geminiApiKey = getGeminiApiKey()

  if (geminiApiKey) {
    try {
      return await estimateNutritionWithGemini(ingredients)
    } catch (error) {
      console.error('Gemini nutrition fallback error:', error)
    }
  }

  try {
    return await estimateNutritionWithFatSecret(ingredients)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'FatSecret lookup failed'

    if (geminiApiKey) {
      return estimateNutritionWithGemini(ingredients)
    }

    if (isFatSecretNetworkBlock(message)) {
      throw new Error('FatSecret rejected this server IP. Add GEMINI_API_KEY for a Vercel-safe fallback or switch nutrition providers.')
    }

    throw error
  }
}

export async function POST(req: NextRequest) {
  const { ingredients } = await req.json()

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return NextResponse.json({ error: 'No ingredients provided' }, { status: 400 })
  }

  try {
    const nutrition = await estimateNutrition(ingredients)
    return NextResponse.json(nutrition)
  } catch (error) {
    console.error('Nutrition API error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch nutrition data'
    const status = /missing/i.test(message) || /rejected this server ip/i.test(message) ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
