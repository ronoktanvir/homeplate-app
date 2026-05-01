'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const DIFFICULTY = ['Easy', 'Medium', 'Hard']
const SUGGESTED_TAGS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'high-protein', 'italian', 'asian', 'mexican']

export default function NewPostPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [dishName, setDishName] = useState('')
  const [caption, setCaption] = useState('')
  const [cookTime, setCookTime] = useState('')
  const [servings, setServings] = useState(2)
  const [difficulty, setDifficulty] = useState('Easy')
  const [ingredients, setIngredients] = useState<string[]>([])
  const [ingredientInput, setIngredientInput] = useState('')
  const [steps, setSteps] = useState<string[]>([''])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [nutrition, setNutrition] = useState<any>(null)
  const [nutritionLoading, setNutritionLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function addIngredient() {
    if (!ingredientInput.trim()) return
    setIngredients(prev => [...prev, ingredientInput.trim()])
    setIngredientInput('')
  }

  function removeIngredient(i: number) {
    setIngredients(prev => prev.filter((_, idx) => idx !== i))
    setNutrition(null)
  }

  async function analyzeNutrition() {
    if (ingredients.length === 0) return
    setNutritionLoading(true)
    try {
      const res = await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNutrition({
        calories: Math.round(data.calories / servings),
        protein_g: Math.round((data.protein_g / servings) * 10) / 10,
        carbs_g: Math.round((data.carbs_g / servings) * 10) / 10,
        fat_g: Math.round((data.fat_g / servings) * 10) / 10,
        fiber_g: data.fiber_g,
        sodium_mg: data.sodium_mg,
        labels: data.labels,
      })
    } catch (e: any) {
      setError(e?.message || 'Could not analyze nutrition. Check your ingredient format (e.g. "200g pasta").')
    }
    setNutritionLoading(false)
  }

  async function handlePost() {
    if (!dishName) { setError('Please add a dish name.'); return }
    setPosting(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    let image_url = null
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(path, imageFile)
      if (!uploadError) {
        const { data } = supabase.storage.from('post-images').getPublicUrl(path)
        image_url = data.publicUrl
      }
    }

    const postData = {
      dish_name: dishName,
      caption,
      cook_time: cookTime,
      servings,
      difficulty,
      ingredients,
      steps: steps.filter(s => s.trim()),
      tags,
      image_url,
      ...(nutrition ? {
        calories: nutrition.calories,
        protein_g: nutrition.protein_g,
        carbs_g: nutrition.carbs_g,
        fat_g: nutrition.fat_g,
        fiber_g: nutrition.fiber_g,
        sodium_mg: nutrition.sodium_mg,
        nutrition_labels: nutrition.labels,
      } : {}),
    }

    const res = await fetch('/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    })

    if (res.ok) router.push('/feed')
    else {
      const data = await res.json().catch(() => null)
      setError(data?.error || 'Failed to post. Please try again.')
      setPosting(false)
    }
  }

  return (
    <div className="form-page">
      <h1 className="page-title">Create a new dish</h1>

      {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="form-section">
        <label className="form-label">Photo</label>
        <div className="upload-zone" onClick={() => fileRef.current?.click()}
          style={imagePreview ? { padding: 0, border: 'none' } : {}}>
          {imagePreview
            ? <img src={imagePreview} alt="preview" style={{ width: '100%', borderRadius: 12, maxHeight: 280, objectFit: 'cover' }} />
            : <>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                <p>Click or drag to upload</p>
              </>
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
      </div>

      <div className="form-section">
        <label className="form-label">Dish name</label>
        <input className="input" placeholder="e.g. Green goddess pasta" value={dishName} onChange={e => setDishName(e.target.value)} />
      </div>

      <div className="form-section">
        <label className="form-label">Caption</label>
        <textarea className="input" placeholder="Describe your dish..." value={caption} onChange={e => setCaption(e.target.value)} />
      </div>

      <div className="form-section">
        <div className="form-row">
          <div>
            <label className="form-label">Cook time</label>
            <input className="input" placeholder="e.g. 30 min" value={cookTime} onChange={e => setCookTime(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Servings</label>
            <input className="input" type="number" min={1} max={20} value={servings} onChange={e => setServings(Number(e.target.value))} />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label className="form-label">Difficulty</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {DIFFICULTY.map(d => (
              <button key={d} className={`btn btn-sm ${difficulty === d ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setDifficulty(d)}>{d}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="form-section">
        <label className="form-label">Ingredients <span className="text-muted text-sm">(use amounts for better nutrition: "200g pasta")</span></label>
        <div className="ingredient-list" style={{ marginBottom: 8 }}>
          {ingredients.map((ing, i) => (
            <div key={i} className="ingredient-item">
              {ing}
              <button onClick={() => removeIngredient(i)}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" placeholder="Add ingredient..."
            value={ingredientInput}
            onChange={e => setIngredientInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addIngredient()} />
          <button className="btn btn-secondary btn-sm" onClick={addIngredient} style={{ whiteSpace: 'nowrap' }}>+ Add</button>
        </div>
        {ingredients.length > 0 && !nutrition && (
          <button className="btn btn-outline btn-sm" style={{ marginTop: 10 }} onClick={analyzeNutrition} disabled={nutritionLoading}>
            {nutritionLoading ? 'Analyzing...' : 'Analyze nutrition'}
          </button>
        )}
      </div>

      {nutrition && (
        <div className="form-section">
          <div className="success-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            Nutrition analyzed successfully
          </div>
          <div className="nutrition-panel">
            <div className="nutrition-label">Nutrition per serving (serves {servings})</div>
            <div className="nutrition-grid">
              <div className="nutrition-stat"><div className="value cal">{nutrition.calories}</div><div className="unit">calories</div></div>
              <div className="nutrition-stat"><div className="value protein">{nutrition.protein_g}g</div><div className="unit">protein</div></div>
              <div className="nutrition-stat"><div className="value carbs">{nutrition.carbs_g}g</div><div className="unit">carbs</div></div>
              <div className="nutrition-stat"><div className="value fat">{nutrition.fat_g}g</div><div className="unit">fat</div></div>
            </div>
            {nutrition.labels?.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {nutrition.labels.slice(0, 5).map((l: string) => (
                  <span key={l} className="tag dietary">{l.toLowerCase().replace(/_/g, ' ')}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="form-section">
        <label className="form-label">Recipe steps</label>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
            <span style={{ paddingTop: 10, color: 'var(--text-muted)', fontSize: 13, minWidth: 20 }}>{i + 1}.</span>
            <textarea className="input" placeholder={`Step ${i + 1}...`} style={{ minHeight: 60 }}
              value={step} onChange={e => { const s = [...steps]; s[i] = e.target.value; setSteps(s) }} />
          </div>
        ))}
        <button className="btn btn-secondary btn-sm" onClick={() => setSteps(s => [...s, ''])}>+ Add step</button>
      </div>

      <div className="form-section">
        <label className="form-label">Tags</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {SUGGESTED_TAGS.map(t => (
            <button key={t} className={`tag ${tags.includes(t) ? 'dietary' : ''}`}
              style={{ cursor: 'pointer', border: '1px solid var(--border)' }}
              onClick={() => setTags(tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t])}>
              {t}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" placeholder="Custom tag..." value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && tagInput.trim()) { setTags(t => [...t, tagInput.trim()]); setTagInput('') } }} />
          <button className="btn btn-secondary btn-sm"
            onClick={() => { if (tagInput.trim()) { setTags(t => [...t, tagInput.trim()]); setTagInput('') } }}>+ Add</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={handlePost} disabled={posting}>
          {posting ? 'Posting...' : 'Post dish'}
        </button>
        <button className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
      </div>
    </div>
  )
}
