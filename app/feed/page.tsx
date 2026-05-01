'use client'
import { useEffect, useState } from 'react'
import PostCard from '@/components/PostCard'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function FeedPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    fetch('/posts?type=feed')
      .then(r => r.json())
      .then(data => { setPosts(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: 40 }}>Loading your feed...</div>

  if (posts.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🍳</div>
      <h2 style={{ fontWeight: 500, marginBottom: 8 }}>Your feed is empty</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Follow some cooks or explore trending dishes</p>
      <Link href="/explore" className="btn btn-primary">Explore dishes</Link>
    </div>
  )

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {posts.map(post => <PostCard key={post.id} post={post} currentUser={user} />)}
    </div>
  )
}
