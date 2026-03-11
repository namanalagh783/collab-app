import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleRegister() {
    if (!name || !email || !password) return setError('Please fill in all fields.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    })

    if (error) setError(error.message)
    else setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center animate-slide-up">
          <div className="w-16 h-16 bg-ink flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-paper" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display font-bold text-3xl text-ink mb-3">Check your email</h2>
          <p className="font-body text-muted mb-8">
            We've sent a confirmation link to <strong className="text-ink">{email}</strong>. Click it to activate your account.
          </p>
          <Link to="/login" className="btn-primary inline-block">Back to Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-ink flex-col justify-between p-16">
        <span className="font-display font-bold text-paper text-xl tracking-tight">COLLAB</span>
        <div>
          <h1 className="font-display font-bold text-paper text-5xl leading-tight mb-6">
            Start collaborating<br />
            <span className="text-accent">in seconds.</span>
          </h1>
          <p className="font-body text-muted text-lg leading-relaxed">
            Create your account and invite your team to a shared workspace — no setup required.
          </p>
        </div>
        <p className="font-mono text-muted text-xs">© 2024 Collab Platform</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden mb-10">
            <span className="font-display font-bold text-ink text-xl tracking-tight">COLLAB</span>
          </div>

          <h2 className="font-display font-bold text-3xl text-ink mb-2">Create account</h2>
          <p className="font-body text-muted mb-10">Join your team's workspace</p>

          <div className="flex flex-col gap-4">
            <div>
              <label className="font-display text-xs uppercase tracking-widest text-muted mb-2 block">Full Name</label>
              <input
                className="input-field"
                type="text"
                placeholder="Jane Smith"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="font-display text-xs uppercase tracking-widest text-muted mb-2 block">Email</label>
              <input
                className="input-field"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="font-display text-xs uppercase tracking-widest text-muted mb-2 block">Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
              />
            </div>

            {error && (
              <p className="font-body text-sm text-accent bg-accent/10 px-4 py-3 border border-accent/20">
                {error}
              </p>
            )}

            <button
              className="btn-primary mt-2 flex items-center justify-center gap-2"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-paper border-t-transparent rounded-full animate-spin" />
              ) : 'Create Account'}
            </button>
          </div>

          <p className="font-body text-sm text-muted mt-8 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-ink font-medium hover:text-accent transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}