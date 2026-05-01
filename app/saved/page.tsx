'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function SavedPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('saved_posts')
        .select('posts(*)')
        .eq('user_id', user.id)
      setPosts(data?.map((s: any) => s.posts).filter(Boolean) || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: 40 }}>Loading...</div>

  return (
    <div>
      <h1 className="page-title">Saved</h1>
      {posts.length === 0
        ? <p style={{ color: 'var(--text-muted)' }}>No saved dishes yet. Bookmark posts from your feed!</p>
        : <div className="explore-grid">
            {posts.map((post: any) => (
              <Link key={post.id} href={`/post/${post.id}`} className="explore-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="explore-card-img">
                  {post.image_url ? <img src={post.image_url} alt={post.dish_name} /> : <div style={{ width: '100%', height: '100%', background: 'var(--green-light)' }} />}
                </div>
                <div className="explore-card-info">
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{post.dish_name}</div>
                </div>
              </Link>
            ))}
          </div>
      }
    </div>
  )
}