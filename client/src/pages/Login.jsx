import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) return setError('Please fill in all fields.')
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
    // App.jsx listener handles redirect automatically
  }

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 bg-ink flex-col justify-between p-16">
        <div>
          <span className="font-display font-bold text-paper text-xl tracking-tight">COLLAB</span>
        </div>
        <div>
          <h1 className="font-display font-bold text-paper text-5xl leading-tight mb-6">
            Write together,<br />
            <span className="text-accent">in real time.</span>
          </h1>
          <p className="font-body text-muted text-lg leading-relaxed">
            A collaborative document editor that keeps everyone on the same page — literally.
          </p>
        </div>
        <p className="font-mono text-muted text-xs">© 2024 Collab Platform</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <span className="font-display font-bold text-ink text-xl tracking-tight">COLLAB</span>
          </div>

          <h2 className="font-display font-bold text-3xl text-ink mb-2">Welcome back</h2>
          <p className="font-body text-muted mb-10">Sign in to your workspace</p>

          <div className="flex flex-col gap-4">
            <div>
              <label className="font-display text-xs uppercase tracking-widest text-muted mb-2 block">Email</label>
              <input
                className="input-field"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <div>
              <label className="font-display text-xs uppercase tracking-widest text-muted mb-2 block">Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {error && (
              <p className="font-body text-sm text-accent bg-accent/10 px-4 py-3 border border-accent/20">
                {error}
              </p>
            )}

            <button
              className="btn-primary mt-2 flex items-center justify-center gap-2"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-paper border-t-transparent rounded-full animate-spin" />
              ) : 'Sign In'}
            </button>
          </div>

          <p className="font-body text-sm text-muted mt-8 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-ink font-medium hover:text-accent transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}