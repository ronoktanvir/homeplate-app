'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const AVATAR_COLORS = ['#D4763A', '#5B8A3C', '#3B8BD4', '#E8C547', '#7F77DD', '#1D9E75']
function avatarColor(str: string) { return AVATAR_COLORS[(str?.charCodeAt(0) || 0) % AVATAR_COLORS.length] }
function initials(str: string) { return (str || 'U').slice(0, 2).toUpperCase() }

export default function SearchUsersPage() {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [followed, setFollowed] = useState<Record<string, boolean>>({})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null))
  }, [])

  useEffect(() => {
    if (results.length > 0) {
      loadFollowState(results)
    }
  }, [currentUserId])

  async function loadFollowState(users: any[]) {
    if (!currentUserId || users.length === 0) {
      setFollowed({})
      return
    }

    const ids = users.map(user => user.id)
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUserId)
      .in('following_id', ids)

    const nextFollowed = Object.fromEntries((data || []).map(row => [row.following_id, true]))
    setFollowed(nextFollowed)
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${query}%`)
      .limit(20)
    const filtered = (data || []).filter((user: any) => user.id !== currentUserId)
    setResults(filtered)
    setLoading(false)
  }

  async function toggleFollow(targetId: string) {
    if (!currentUserId) {
      setError('Please sign in to follow people.')
      return
    }

    const action = followed[targetId] ? 'unfollow' : 'follow'
    setFollowed(f => ({ ...f, [targetId]: !f[targetId] }))

    try {
      const res = await fetch('/api/users/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: targetId, action }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Could not update follow status')
      }
    } catch (err) {
      setFollowed(f => ({ ...f, [targetId]: !f[targetId] }))
      setError(err instanceof Error ? err.message : 'Could not update follow status')
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 className="page-title">Find friends</h1>

      <form onSubmit={handleSearch}>
        <div className="search-bar" style={{ marginBottom: 24 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            placeholder="Search by username..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <button className="btn btn-primary btn-sm" type="submit">Search</button>
        </div>
      </form>

      {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
      {loading && <div style={{ color: 'var(--text-muted)' }}>Searching...</div>}

      {results.length === 0 && !loading && query && (
        <div style={{ color: 'var(--text-muted)' }}>No users found for &quot;{query}&quot;</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {results.map(user => (
          <div key={user.id} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '14px 16px'
          }}>
            <Link href={`/profile/${user.username}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <div className="avatar" style={{ background: avatarColor(user.username) }}>
                {initials(user.display_name || user.username)}
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>{user.username}</div>
                {user.bio && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{user.bio}</div>}
              </div>
            </Link>
            <button
              className={`btn btn-sm ${followed[user.id] ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => toggleFollow(user.id)}>
              {followed[user.id] ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
