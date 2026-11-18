
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './Profile.css'

function Profile() {
  const navigate = useNavigate()
  const role = localStorage.getItem('role') || 'job_seeker'
  const isRecruiter = role === 'recruiter'

  const [formData, setFormData] = useState({
    phone: '',
    location: '',
    bio: '',
    skills: '',
    education: '',
    experience: '',
    portfolio_url: '',
    company_name: '',
    company_website: '',
    designation: '',
  })

  const [photoFile, setPhotoFile] = useState(null)
  const [existingPhoto, setExistingPhoto] = useState('')
  const [photoPreview, setPhotoPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('accessToken')

    if (!token) {
      navigate('/login')
      return
    }

    api.get('accounts/profile/')
      .then((response) => {
        const data = response.data

        setFormData({
          phone: data.phone || '',
          location: data.location || '',
          bio: data.bio || '',
          skills: data.skills || '',
          education: data.education || '',
          experience: data.experience || '',
          portfolio_url: data.portfolio_url || '',
          company_name: data.company_name || '',
          company_website: data.company_website || '',
          designation: data.designation || '',
        })

        setExistingPhoto(data.profile_photo || '')
      })
      .catch((err) => {
        console.error('Profile loading error:', err.response?.data || err)

        setError(
          err.response?.status === 401
            ? 'Session expired. Please log in again.'
            : 'Unable to load your profile. Please try again.'
        )
      })
      .finally(() => setLoading(false))
  }, [navigate])

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview('')
      return
    }

    const previewUrl = URL.createObjectURL(photoFile)
    setPhotoPreview(previewUrl)

    return () => URL.revokeObjectURL(previewUrl)
  }, [photoFile])

  useEffect(() => {
    if (!message && !error) return

    const timer = setTimeout(() => {
      setMessage('')
      setError('')
    }, 4000)

    return () => clearTimeout(timer)
  }, [message, error])

  const getPhotoUrl = (photo) => {
    if (!photo) return ''
    if (photo.startsWith('http')) return photo

    return `http://127.0.0.1:8000${photo.startsWith('/') ? '' : '/'}${photo}`
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be 5 MB or less.')
      event.target.value = ''
      return
    }

    setError('')
    setMessage('')
    setPhotoFile(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    const payload = new FormData()

    const commonFields = ['phone', 'location', 'bio']
    const seekerFields = [
      'skills',
      'education',
      'experience',
      'portfolio_url',
    ]
    const recruiterFields = [
      'company_name',
      'company_website',
      'designation',
    ]

    const fieldsToSubmit = [
      ...commonFields,
      ...(isRecruiter ? recruiterFields : seekerFields),
    ]

    fieldsToSubmit.forEach((field) => {
      payload.append(field, formData[field])
    })

    if (photoFile) {
      payload.append('profile_photo', photoFile)
    }

    try {
      const response = await api.patch('accounts/profile/', payload)

      setExistingPhoto(response.data.profile_photo || existingPhoto)
      setPhotoFile(null)
      setMessage('Profile saved successfully!')
    } catch (err) {
      console.error('Profile save error:', err.response?.data || err)

      setError(
        err.response?.status === 401
          ? 'Session expired. Please log in again.'
          : 'Unable to save your profile. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="profile-loading">Loading your profile...</div>
  }

  const displayedPhoto = photoPreview || getPhotoUrl(existingPhoto)

  const renderField = (name, label, placeholder, multiline = false) => (
    <div className="profile-field" key={name}>
      <label htmlFor={name}>{label}</label>
      {multiline ? (
        <textarea
          id={name}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          placeholder={placeholder}
          rows={3}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={name.includes('url') || name.includes('website') ? 'url' : 'text'}
          value={formData[name]}
          onChange={handleChange}
          placeholder={placeholder}
        />
      )}
    </div>
  )

  return (
    <div className="profile-page">
      <div className="profile-card">
        <button
          className="profile-back"
          type="button"
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </button>

        <div className="profile-heading">
          <div className="profile-avatar">
            {displayedPhoto ? (
              <img
                src={displayedPhoto}
                alt="Profile"
                className="profile-photo-preview"
              />
            ) : (
              (localStorage.getItem('username') || 'U')
                .charAt(0)
                .toUpperCase()
            )}
          </div>

          <div>
            <h1>My Profile</h1>
            <p>
              {isRecruiter
                ? 'Manage your recruiter and company information.'
                : 'Keep your professional information up to date.'}
            </p>
          </div>
        </div>

        <div className="profile-photo-field">
          <label htmlFor="profile_photo">Profile Photo</label>
          <input
            id="profile_photo"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
          />
          <small>Choose an image. Maximum size: 5 MB.</small>
        </div>

        {message && <div className="profile-success">{message}</div>}
        {error && <div className="profile-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="profile-form-grid">
            {renderField('phone', 'Phone Number', 'Enter your phone number')}
            {renderField('location', 'Location', 'e.g. Kerala, India')}

            {isRecruiter ? (
              <>
                {renderField('company_name', 'Company Name', 'Enter your company name')}
                {renderField('designation', 'Job Title / Designation', 'e.g. HR Manager')}
                {renderField('company_website', 'Company Website', 'https://example.com')}
              </>
            ) : (
              <>
                {renderField('skills', 'Skills', 'e.g. Python, Django, React', true)}
                {renderField('education', 'Education', 'Enter your qualification and institution', true)}
                {renderField('experience', 'Experience', 'Describe your work or internship experience', true)}
                {renderField('portfolio_url', 'Portfolio / LinkedIn URL', 'https://example.com')}
              </>
            )}

            <div className="profile-field profile-full-width">
              <label htmlFor="bio">Professional Summary</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Write a short professional introduction..."
                rows={4}
              />
            </div>
          </div>

          <button className="profile-save" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Profile
