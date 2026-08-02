import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/authService'

function LoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setIsLoading(true)

    try {
      const data = await login(email, password)

      sessionStorage.setItem('supportflow_token', data.token)

      sessionStorage.setItem(
        'supportflow_user',
        JSON.stringify({
          userId: data.userId,
          fullName: data.fullName,
          email: data.email,
          roles: data.roles,
        }),
      )

      navigate('/dashboard')
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        'Login failed. Please check your email and password.'

      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-heading">
          <span className="login-logo">SF</span>

          <div>
            <h1>Welcome to SupportFlow</h1>
            <p>Sign in to manage your support tickets.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="email">Email address</label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ali@test.com"
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>

          <div className="password-field">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              className="show-password-button"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default LoginPage