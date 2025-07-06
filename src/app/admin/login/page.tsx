'use client'

import { useRouter } from 'next/navigation'
import { useState, FormEvent } from 'react'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()

    if (res.ok) {
      localStorage.setItem('adminToken', data.token)
      router.push('/admin')
    } else {
      setError(data.error)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    handleLogin()
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-primary-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-sm space-y-4"
      >
        <h1 className="text-xl font-semibold">Admin Login</h1>
        <input
          type="email"
          placeholder="Email"
          className="w-full border px-4 py-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border px-4 py-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-secondary-500 text-white py-2 rounded"
        >
          Login
        </button>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </form>
    </main>
  )
}
