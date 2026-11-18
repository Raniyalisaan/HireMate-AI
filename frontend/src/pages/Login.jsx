
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import './Auth.css'

function Login() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('token/', formData)

      // Store JWT tokens for authenticated API requests.
      localStorage.setItem('accessToken', response.data.access)
      localStorage.setItem('refreshToken', response.data.refresh)
      localStorage.setItem('username', formData.username)

      const profileResponse = await api.get('accounts/profile/')

     
      const profile = profileResponse.data

      localStorage.setItem(
        'role',
        profile.role || 'job_seeker'
      )

      localStorage.setItem(
        'profilePhoto',
        profile.profile_photo || ''
      )

      navigate('/')


    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid username or password.')
      } else if (err.response?.data) {
        setError('Login failed. Please check your details.')
      } else {
        setError(
          'Cannot connect to the server. Make sure Django is running.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          HireMate <span>AI</span>
        </Link>

        <h1>Welcome back!</h1>

        <p className="auth-subtitle">
          Sign in to continue your career journey.
        </p>

        {error && (
          <p className="register-error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />

            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              <Link to="/forgot-password">
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/register">Create account</Link>
        </p>

        <Link to="/" className="back-home">
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}

export default Login