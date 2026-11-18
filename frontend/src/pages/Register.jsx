
import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import './Auth.css'

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'job_seeker',
    password: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

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
      await api.post('accounts/register/', formData)

      setFormData({
        username: '',
        email: '',
        role: 'job_seeker',
        password: '',
      })

      setShowSuccessModal(true)
    } catch (err) {
      const data = err.response?.data

      if (data) {
        const details = Object.entries(data)
          .map(([field, errors]) => {
            const text = Array.isArray(errors)
              ? errors.join(', ')
              : String(errors)

            return `${field}: ${text}`
          })
          .join(' | ')

        setError(
          details || 'Registration failed. Please try again.'
        )
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

        <h1>Create your account</h1>

        <p className="auth-subtitle">
          Start building your career with AI-powered tools.
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
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-email">Email address</label>
            <input
              type="email"
              id="register-email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">I want to join as</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="job_seeker">Job Seeker</option>
              <option value="recruiter">Recruiter</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="register-password">Password</label>
            <input
              type="password"
              id="register-password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>

        <Link to="/" className="back-home">
          ← Back to Home
        </Link>
      </div>

      {showSuccessModal && (
        <div
          className="success-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-modal-title"
        >
          <div className="success-modal">
            <div className="success-icon">✓</div>

            <h2 id="success-modal-title">
              Registered Successfully!
            </h2>

            <p>
              Your HireMate AI account has been created
              successfully. You can now sign in to your account.
            </p>

            <Link
              to="/login"
              className="auth-submit modal-button"
            >
              Continue to Login
            </Link>

            <button
              type="button"
              className="modal-close"
              onClick={() => setShowSuccessModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Register