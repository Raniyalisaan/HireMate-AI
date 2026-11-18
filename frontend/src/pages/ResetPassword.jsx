
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api'
import './Auth.css'

function ResetPassword() {
  const { uid, token } = useParams()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: '',
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.new_password !== formData.confirm_password) {
      setError('Passwords do not match.')
      return
    }

    if (formData.new_password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('accounts/reset-password/', {
        uid,
        token,
        new_password: formData.new_password,
      })

      setSuccess(response.data.message)

      setTimeout(() => {
        navigate('/login')
      }, 2000)

    } catch (err) {
      const data = err.response?.data
      setError(
        Array.isArray(data?.message)
          ? data.message.join(' ')
          : data?.message || 'Password reset failed. Please try again.'
      )
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

        <h1>Reset Password</h1>

        <p className="auth-subtitle">
          Create a new password for your account.
        </p>

        {error && (
          <p className="register-error" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="auth-success" role="status">
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="new_password">New Password</label>
            <input
              type="password"
              id="new_password"
              name="new_password"
              placeholder="Enter new password"
              value={formData.new_password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm_password">Confirm Password</label>
            <input
              type="password"
              id="confirm_password"
              name="confirm_password"
              placeholder="Confirm new password"
              value={formData.confirm_password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>

        <p className="auth-switch">
          Remember your password? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  )
}

export default ResetPassword
