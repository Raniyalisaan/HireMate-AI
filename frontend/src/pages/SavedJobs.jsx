
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './SavedJobs.css'

function SavedJobs() {
  const navigate = useNavigate()

  const [savedJobs, setSavedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!message) return

    const timer = setTimeout(() => {
      setMessage('')
    }, 3000)

    return () => clearTimeout(timer)
  }, [message])

  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await api.get('jobs/saved/')
        const data = response.data

        setSavedJobs(Array.isArray(data) ? data : data.results || [])
      } catch (err) {
        console.error(
          'Saved jobs API error:',
          err.response?.status,
          err.response?.data || err.message
        )

        if (err.response?.status === 401) {
          setError('Please log in to view your saved jobs.')
        } else if (err.response?.status === 403) {
          setError('Saved Jobs are available only to job seekers.')
        } else {
          setError('Unable to load saved jobs. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchSavedJobs()
  }, [])

  const handleRemoveJob = async (savedJobId) => {
    try {
      await api.delete(`jobs/saved/${savedJobId}/`)

      setSavedJobs((previousJobs) =>
        previousJobs.filter((item) => item.id !== savedJobId)
      )

      setMessage('Saved job removed successfully.')
    } catch (err) {
      console.error(
        'Remove saved job error:',
        err.response?.data || err.message
      )

      setMessage('Unable to remove this job. Please try again.')
    }
  }

  return (
    <div className="saved-jobs-page">
      <header className="saved-jobs-header">
        <h1>Saved Jobs</h1>
        <p>Keep track of the opportunities you want to explore.</p>
      </header>

      <button
        type="button"
        className="saved-jobs-back-button"
        onClick={() => navigate('/dashboard')}
      >
        ← Back to Dashboard
      </button>

      {message && (
        <p
          className={`saved-jobs-feedback ${
            message.includes('successfully') ? 'success' : 'error'
          }`}
          role="status"
        >
          {message}
        </p>
      )}

      {loading && <p>Loading saved jobs...</p>}

      {error && <p className="saved-jobs-error">{error}</p>}

      {!loading && !error && savedJobs.length === 0 && (
        <div className="saved-jobs-empty">
          <h2>No saved jobs yet</h2>
          <p>Explore available jobs and save the ones you like.</p>
          <button
            type="button"
            onClick={() => navigate('/jobs')}
          >
            Explore Jobs
          </button>
        </div>
      )}

      {!loading && !error && savedJobs.length > 0 && (
        <div className="saved-jobs-list">
          {savedJobs.map((item) => {
            const job = item.job_details

            if (!job) return null

            return (
              <article className="saved-job-card" key={item.id}>
                <h2>{job.title}</h2>
                <p>Company: {job.company || 'Not specified'}</p>
                <p>Location: {job.location || 'Not specified'}</p>
                <p>Salary: {job.salary ? `₹${job.salary}` : 'Not specified'}</p>
                <p>
                  Experience: {job.experience_level || 'Not specified'}
                </p>
                <p>Job type: {job.job_type || 'Not specified'}</p>

                <button
                  type="button"
                  onClick={() => handleRemoveJob(item.id)}
                >
                  Remove Saved Job
                </button>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SavedJobs
