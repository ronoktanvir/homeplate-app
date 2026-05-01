'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { use } from 'react'

const AVATAR_COLORS = ['#D4763A', '#5B8A3C', '#3B8BD4', '#E8C547', '#7F77DD', '#1D9E75']
function avatarColor(str: string) { return AVATAR_COLORS[(str?.charCodeAt(0) || 0) % AVATAR_COLORS.length] }
function initials(str: string) { return (str || 'U').slice(0, 2).toUpperCase() }

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [saved, setSaved] = useState<any[]>([])
  const [tab, setTab] = useState<'posts' | 'saved'>('posts')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (!profileData) { setLoading(false); return }
      setProfile(profileData)

      const [postsRes, followersRes, followingRes] = await Promise.all([
        supabase.from('posts').select('*').eq('user_id', profileData.id).order('created_at', { ascending: false }),
        supabase.from('follows').select('count', { count: 'exact' }).eq('following_id', profileData.id),
        supabase.from('follows').select('count', { count: 'exact' }).eq('follower_id', profileData.id),
      ])

      setPosts(postsRes.data || [])
      setFollowerCount(followersRes.count || 0)
      setFollowingCount(followingRes.count || 0)

      if (user) {
        const { data: followCheck } = await supabase
          .from('follows').select('id')
          .eq('follower_id', user.id).eq('following_id', profileData.id).single()
        setIsFollowing(!!followCheck)

        const { data: savedData } = await supabase
          .from('saved_posts').select('posts(*)').eq('user_id', user.id)
        setSaved(savedData?.map((s: any) => s.posts).filter(Boolean) || [])
      }
      setLoading(false)
    }
    load()
  }, [username])

  async function toggleFollow() {
    if (!currentUser || !profile) return
    const action = isFollowing ? 'unfollow' : 'follow'
    setIsFollowing(!isFollowing)
    setFollowerCount(c => isFollowing ? c - 1 : c + 1)

    const res = await fetch('/api/users/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_id: profile.id, action }),
    })

    if (!res.ok) {
      setIsFollowing(isFollowing)
      setFollowerCount(c => isFollowing ? c + 1 : c - 1)
    }
  }

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: 40 }}>Loading profile...</div>
  if (!profile) return <div style={{ padding: 40 }}>User not found.</div>

  const isOwnProfile = currentUser?.id === profile.id
  const displayPosts = tab === 'posts' ? posts : saved

  return (
    <div>
      <div className="profile-header">
        <div className="avatar lg" style={{ background: avatarColor(profile.username) }}>
          {initials(profile.display_name || profile.username)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 500 }}>{profile.username}</span>
            {isOwnProfile
              ? <button className="btn btn-secondary btn-sm">Edit profile</button>
              : currentUser && (
                  <button className={`btn btn-sm ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={toggleFollow}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )
            }
          </div>
          <div className="profile-stats">
            <div className="profile-stat"><div className="count">{posts.length}</div><div className="stat-label">posts</div></div>
            <div className="profile-stat"><div className="count">{followerCount}</div><div className="stat-label">followers</div></div>
            <div className="profile-stat"><div className="count">{followingCount}</div><div className="stat-label">following</div></div>
          </div>
          {profile.bio && <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 360 }}>{profile.bio}</p>}
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn${tab === 'posts' ? ' active' : ''}`} onClick={() => setTab('posts')}>Posts</button>
        {isOwnProfile && <button className={`tab-btn${tab === 'saved' ? ' active' : ''}`} onClick={() => setTab('saved')}>Saved</button>}
      </div>

      <div className="profile-grid">
        {displayPosts.length === 0 && (
          <div style={{ gridColumn: '1/-1', color: 'var(--text-muted)', padding: '40px 0', fontSize: 13 }}>
            {tab === 'posts' ? 'No dishes posted yet.' : 'No saved dishes yet.'}
          </div>
        )}
        {displayPosts.map((post: any) => (
          <Link key={post.id} href={`/post/${post.id}`} className="profile-grid-item" style={{ textDecoration: 'none' }}>
            {post.image_url
              ? <img src={post.image_url} alt={post.dish_name} />
              : <div style={{ width: '100%', height: '100%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--green)' }}>No photo</span>
                </div>
            }
            <div className="dish-label">{post.dish_name}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
