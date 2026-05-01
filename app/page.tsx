'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 48px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-mark">HP</div>
          <span style={{ fontSize: 18, fontWeight: 500 }}>HomePlate</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer' }}>About</span>
          <Link href="/login" style={{ fontSize: 14, color: 'var(--green)', fontWeight: 500, textDecoration: 'none' }}>Log in</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 60, padding: '80px 48px', maxWidth: 1100, margin: '0 auto',
        alignItems: 'center'
      }}>
        {/* Left */}
        <div>
          <h1 style={{ fontSize: 48, fontWeight: 500, lineHeight: 1.15, marginBottom: 20, color: 'var(--text-primary)' }}>
            Share what you cook.<br />Discover what others make.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 40, maxWidth: 400 }}>
            HomePlate is a social platform for home cooks. Post your dishes, get instant nutritional breakdowns, and see what your friends are making.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 40, marginBottom: 40 }}>
            {[
              { value: '2.4k', label: 'home\ncooks', color: 'var(--green)' },
              { value: '8.1k', label: 'dishes\nshared', color: 'var(--terra)' },
              { value: '12k', label: 'recipes\nsaved', color: 'var(--gold)' },
            ].map(s => (
              <div key={s.value}>
                <div style={{ fontSize: 32, fontWeight: 500, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'pre-line', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Avatar stack */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex' }}>
              {[['ML','#D4763A'],['AK','#E8C547'],['DP','#1D9E75']].map(([init, color], i) => (
                <div key={init} style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: color, border: '2px solid var(--bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 500, color: 'white',
                  marginLeft: i > 0 ? -10 : 0, zIndex: 3 - i
                }}>{init}</div>
              ))}
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Join 2,400+ home cooks</span>
          </div>
        </div>

        {/* Right — signup card */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '40px 36px', boxShadow: '0 2px 24px rgba(0,0,0,0.06)'
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 6 }}>Create your account</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 }}>Start sharing your home-cooked creations</p>

          <form onSubmit={e => { e.preventDefault(); router.push('/signup') }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <label className="form-label">Full name</label>
              <input className="input" placeholder="Your name" />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input className="input" type="email" placeholder="you@email.com" />
            </div>
            <div>
              <label className="form-label">Username</label>
              <input className="input" placeholder="@username" />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input className="input" type="password" placeholder="At least 8 characters" />
            </div>

            <button className="btn btn-primary" type="submit"
              style={{ width: '100%', marginTop: 4, padding: '13px' }}>
              Sign up
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--text-primary)', fontWeight: 500, textDecoration: 'none' }}>Log in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
