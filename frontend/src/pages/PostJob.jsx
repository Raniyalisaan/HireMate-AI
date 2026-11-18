
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './PostJob.css'

function PostJob() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    experience_level: 'junior',
    job_type: 'full_time',
    description: '',
    required_skills: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
  const fetchProfile = async () => {
    try {
      const response = await api.get('accounts/profile/')
      setFormData((prev) => ({
        ...prev,
        company: response.data.company_name || '',
      }))
    } catch (err) {
      console.error('Unable to load recruiter profile:', err)
    }
  }

  fetchProfile()
}, [])

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      await api.post('jobs/', {
        ...formData,
        salary: formData.salary || null,
      })

      setMessage('Job posted successfully!')
      setFormData({
        title: '',
        company: '',
        location: '',
        salary: '',
        experience_level: 'junior',
        job_type: 'full_time',
        description: '',
        required_skills: '',
      })
    } catch (err) {
      console.error('Job posting error:', err.response?.data || err)
      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : 'Unable to post the job. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="post-job-page">
      <button type="button" onClick={() => navigate('/')}>
        ← Back to Home
      </button>

      <h1>Post a New Job</h1>
      <p>Share your job opportunity with potential candidates.</p>

      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>
          Job Title
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Company Name
          <input
            name="company"
            value={formData.company}
            readOnly
            required
            />
        </label>

        <label>
          Location
          <input
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Salary
          <input
            name="salary"
            type="number"
            min="0"
            value={formData.salary}
            onChange={handleChange}
          />
        </label>

       
<label>
  Experience Level
  <select
    name="experience_level"
    value={formData.experience_level}
    onChange={handleChange}
  >
    <option value="fresher">Fresher</option>
    <option value="junior">Junior</option>
    <option value="mid_level">Mid Level</option>
    <option value="senior">Senior</option>
  </select>
</label>


        <label>
          Job Type
          <select
            name="job_type"
            value={formData.job_type}
            onChange={handleChange}
          >
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </label>

        <label>
          Job Description
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={5}
          />
        </label>

        <label>
          Required Skills
          <textarea
            name="required_skills"
            value={formData.required_skills}
            onChange={handleChange}
            required
            rows={3}
            placeholder="Python, Django, React, PostgreSQL"
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Posting...' : 'Post Job'}
        </button>
      </form>
    </div>
  )
}

export default PostJob
