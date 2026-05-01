'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { use } from 'react'
import PostCard from '@/components/PostCard'

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const [post, setPost] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id(id, username, display_name, avatar_url),
          likes(count),
          comments(count)
        `)
        .eq('id', id)
        .single()
      setPost(data)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: 40 }}>Loading...</div>
  if (!post) return <div style={{ padding: 40 }}>Post not found.</div>

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <PostCard post={post} currentUser={user} />
    </div>
  )
}