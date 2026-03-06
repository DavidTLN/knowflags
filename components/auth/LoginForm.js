'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

export default function LoginForm() {
  const supabase = createClient()
  const router = useRouter()
  const locale = useLocale()

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Invalid email or password. Please try again.')
      } else {
        router.push('/' + locale)
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }
      })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Account created! Please check your email to confirm your account.')
      }
    }

    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '2px solid #e2e8f0',
    fontSize: '15px',
    color: '#0B1F3B',
    backgroundColor: 'white',
    boxSizing: 'border-box',
    outline: 'none'
  }

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#0B1F3B',
    marginBottom: '6px'
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>

      {mode === 'signup' && (
        <div>
          <label style={labelStyle}>Username</label>
          <input
            type="text"
            placeholder="Your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={inputStyle}
          />
        </div>
      )}

      <div>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Password</label>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={inputStyle}
        />
      </div>

      {error && (
        <div style={{backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', fontSize: '14px'}}>
          {error}
        </div>
      )}

      {success && (
        <div style={{backgroundColor: '#dcfce7', color: '#166534', padding: '12px 16px', borderRadius: '8px', fontSize: '14px'}}>
          {success}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: loading ? '#9EB7E5' : '#0B1F3B',
          color: '#F4F1E6',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: '700',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
      </button>

      <p style={{textAlign: 'center', fontSize: '14px', color: '#64748b', margin: 0}}>
        {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
        <button
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setSuccess(null); }}
          style={{background: 'none', border: 'none', color: '#426A5A', fontWeight: '700', cursor: 'pointer', fontSize: '14px'}}
        >
          {mode === 'login' ? 'Sign Up' : 'Sign In'}
        </button>
      </p>

    </div>
  )
}