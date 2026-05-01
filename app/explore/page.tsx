'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const FILTERS = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Vegan', 'High protein']
const FILTER_TAGS: Record<string, string> = {
  'Breakfast': 'breakfast', 'Lunch': 'lunch', 'Dinner': 'dinner',
  'Dessert': 'dessert', 'Vegan': 'vegan', 'High protein': 'high-protein',
}

const AVATAR_COLORS = ['#D4763A', '#5B8A3C', '#3B8BD4', '#E8C547', '#7F77DD', '#1D9E75']
function avatarColor(str: string) { return AVATAR_COLORS[(str?.charCodeAt(0) || 0) % AVATAR_COLORS.length] }

export default function ExplorePage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  function loadPosts(q = '', tag = '') {
    setLoading(true)
    const params = new URLSearchParams({ type: 'explore' })
    if (q) params.set('q', q)
    if (tag) params.set('tag', tag)
    fetch(`/posts?${params}`)
      .then(r => r.json())
      .then(data => { setPosts(Array.isArray(data) ? data : []); setLoading(false) })
  }

  useEffect(() => { loadPosts() }, [])

  function handleFilter(f: string) {
    setActiveFilter(f)
    loadPosts(query, FILTER_TAGS[f] || '')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    loadPosts(query, FILTER_TAGS[activeFilter] || '')
  }

  return (
    <div className="explore-page">
      <form onSubmit={handleSearch}>
        <div className="search-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            placeholder="Search by dish, ingredient, or cook..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </form>

      <div className="filter-row">
        {FILTERS.map(f => (
          <button key={f} className={`filter-pill${activeFilter === f ? ' active' : ''}`} onClick={() => handleFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="section-heading">Trending this week</div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', padding: 40 }}>Loading...</div>
      ) : posts.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', padding: 40 }}>No dishes found. Try a different search.</div>
      ) : (
        <div className="explore-grid">
          {posts.map(post => (
            <Link key={post.id} href={`/post/${post.id}`} className="explore-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="explore-card-img">
                {post.image_url
                  ? <img src={post.image_url} alt={post.dish_name} />
                  : <div style={{ width: '100%', height: '100%', background: 'var(--green-light)' }} />
                }
              </div>
              <div className="explore-card-info">
                <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{post.dish_name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="avatar sm" style={{ background: avatarColor(post.profiles?.username || '') }}>
                    {(post.profiles?.username || 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{post.profiles?.username}</span>
                </div>
                {post.calories && (
                  <span className="tag dietary" style={{ marginTop: 6, display: 'inline-flex' }}>{post.calories} cal</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
