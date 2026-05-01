'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const normalizedUsername = username.trim().replace(/^@/, '').toLowerCase()
    if (!fullName.trim()) {
      setError('Please add your name.')
      setLoading(false)
      return
    }
    if (!normalizedUsername) {
      setError('Please choose a username.')
      setLoading(false)
      return
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', normalizedUsername)
      .maybeSingle()

    if (existingProfile) {
      setError('That username is already taken.')
      setLoading(false)
      return
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    let userId = signUpData.user?.id || null
    if (!signUpData.session) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }
      userId = signInData.user.id
    }

    if (!userId) {
      setError('Could not finish account setup.')
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username: normalizedUsername,
        display_name: fullName.trim(),
      })
      .eq('id', userId)

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    router.push('/feed')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div className="logo-mark">HP</div>
          <span style={{ fontSize: 20, fontWeight: 500 }}>HomePlate</span>
        </div>
        <h1>Start cooking together</h1>
        <p>Create an account to share your homemade dishes.</p>

        <form onSubmit={handleSignup} className="form-gap">
          {error && <div className="error-msg">{error}</div>}
          <div>
            <label className="form-label">Full name</label>
            <input className="input" placeholder="Your name"
              value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input className="input" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="form-label">Username</label>
            <input className="input" placeholder="@username"
              value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input className="input" type="password" placeholder="At least 6 characters"
              value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', marginTop: 4 }}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--green)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
