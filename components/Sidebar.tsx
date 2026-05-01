'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

const AVATAR_COLORS = ['#D4763A', '#5B8A3C', '#3B8BD4', '#E8C547', '#7F77DD', '#1D9E75']
function avatarColor(str: string) { return AVATAR_COLORS[(str?.charCodeAt(0) || 0) % AVATAR_COLORS.length] }
function initials(name: string) { return (name || 'U').slice(0, 2).toUpperCase() }

export default function Sidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [friends, setFriends] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()

    async function loadSidebar() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) return

      setUser(data.user)

      const [{ data: profileData }, { data: follows }] = await Promise.all([
        supabase.from('profiles').select('id, username, display_name').eq('id', data.user.id).single(),
        supabase
          .from('follows')
          .select('profiles:following_id(id, username, display_name)')
          .eq('follower_id', data.user.id)
          .limit(5),
      ])

      setProfile(profileData)
      setFriends(follows?.map((f: any) => f.profiles).filter(Boolean) || [])
    }

    loadSidebar()
  }, [])

  const username = profile?.username || user?.email?.split('@')[0] || ''
  const profileHref = username ? `/profile/${username}` : '/login'

  const navLinks = [
    { href: '/feed', label: 'Feed', icon: <HomeIcon /> },
    { href: '/explore', label: 'Explore', icon: <SearchIcon /> },
    { href: '/new-post', label: 'New post', icon: <PlusIcon /> },
    { href: '/search-users', label: 'Find friends', icon: <FriendsIcon /> },
    { href: '/saved', label: 'Saved', icon: <BookmarkIcon /> },
  ]

  return (
    <aside className="sidebar">
      <Link href="/feed" className="sidebar-logo">
        <div className="logo-mark">HP</div>
        HomePlate
      </Link>

      {navLinks.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={`nav-link${pathname === link.href ? ' active' : ''}`}
        >
          {link.icon}
          {link.label}
        </Link>
      ))}

      <Link
        href={profileHref}
        className={`nav-link${pathname.startsWith('/profile') ? ' active' : ''}`}
      >
        <UserIcon />
        Profile
      </Link>

      {friends.length > 0 && (
        <div className="friends-section">
          <div className="friends-label">Friends</div>
          {friends.map((f: any) => (
            <Link key={f.id} href={`/profile/${f.username}`} className="friend-item">
              <div className="avatar" style={{ background: avatarColor(f.username) }}>
                {initials(f.display_name || f.username)}
                <span className="online-dot" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{f.username}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {user && (
        <Link href={profileHref} className="sidebar-user">
          <div className="avatar" style={{ background: avatarColor(username || user.email || '') }}>
            {initials(username)}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{profile?.display_name || username}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>View profile</div>
          </div>
        </Link>
      )}
    </aside>
  )
}

function HomeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
}
function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
}
function PlusIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5"/><path d="M12 8v8M8 12h8"/></svg>
}
function BookmarkIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
}
function UserIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
function FriendsIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
