
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './RecruiterPages.css'

function MyPostedJobs() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  
  const [editingJob, setEditingJob] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleDeleteJob = async (job) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${job.title}"?`
    )

    if (!confirmed) return

    try {
      await api.delete(`jobs/${job.id}/`)
      setJobs(previous =>
        previous.filter(item => item.id !== job.id)
      )
    } catch (err) {
      console.error('Delete job failed:', err.response?.data || err)
      alert('Could not delete this job. Please try again.')
    }
  }
  
const handleToggleStatus = async (job) => {
  try {
    const response = await api.patch(
      `jobs/${job.id}/toggle-status/`
    );

    setJobs((previousJobs) =>
      previousJobs.map((item) =>
        item.id === job.id
          ? { ...item, is_active: response.data.is_active }
          : item
      )
    );
  } catch (error) {
    console.error('Failed to update job status:', error);
    alert(
      error.response?.data?.detail ||
      error.response?.data?.error ||
      'Could not update job status.'
    );
  }
};

  const handleEditSave = async (event) => {
    event.preventDefault()
    if (!editingJob) return

    setSaving(true)

    try {
     
const response = await api.patch(
  `jobs/${editingJob.id}/`,
  {
    title: editingJob.title,
    company: editingJob.company,
    location: editingJob.location,
    description: editingJob.description,
    required_skills: editingJob.required_skills,
    salary: editingJob.salary || null,
    experience_level: editingJob.experience_level,
    job_type: editingJob.job_type,
  }
)


      setJobs(previous =>
        previous.map(item =>
          item.id === editingJob.id
            ? { ...item, ...response.data }
            : item
        )
      )

      setEditingJob(null)
    } catch (err) {
      console.error('Edit job failed:', err.response?.data || err)
      alert('Could not update the job. Check the required fields.')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    const fetchMyJobs = async () => {
      const token = localStorage.getItem('accessToken')

      if (!token) {
        navigate('/login')
        return
      }

      try {
        const response = await api.get('jobs/')
        const data = response.data
        const allJobs = Array.isArray(data)
          ? data
          : Array.isArray(data.results)
            ? data.results
            : []

        const payload = JSON.parse(atob(token.split('.')[1]))
        const userId = payload.user_id

        const myJobs = allJobs.filter(
          (job) =>
            String(job.recruiter?.id ?? job.recruiter_id ?? job.recruiter) ===
            String(userId)
        )

        setJobs(myJobs)
      } catch (err) {
        console.error('Failed to fetch jobs:', err.response?.data || err)
        setError(
          err.response?.status === 401
            ? 'Your session may have expired. Please log in again.'
            : 'Could not load your posted jobs. Please try again.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchMyJobs()
  }, [navigate])

  return (
    <main className="recruiter-page">
      <header className="recruiter-page-header">
        <div>
          <p className="recruiter-eyebrow">RECRUITER WORKSPACE</p>
          <h1>My Posted Jobs</h1>
          <p>Manage and review the jobs posted by your account.</p>
        </div>

        <button onClick={() => navigate('/post-job')}>
          + Post a Job
        </button>
      </header>

      <button
        className="recruiter-back-button"
        onClick={() => navigate('/')}
      >
        ← Back to Home
      </button>

      {loading ? (
        <p className="recruiter-message">Loading your jobs...</p>
      ) : error ? (
        <p className="recruiter-error">{error}</p>
      ) : jobs.length === 0 ? (
        <div className="recruiter-empty">
          <h2>No jobs posted yet</h2>
          <p>Your posted jobs will appear here.</p>
          <button onClick={() => navigate('/post-job')}>
            Post Your First Job
          </button>
        </div>
      ) : (
        <div className="recruiter-job-list">
         
{jobs.map((job) => (
  <article className="recruiter-job-card" key={job.id}>
    <div>
      <h2>{job.title}</h2>
      <p>🏢 {job.company || 'Company not specified'}</p>
      <p>📍 {job.location || 'Location not specified'}</p>
      <p>
        💰 Salary:{' '}
        {job.salary
          ? `₹${Number(job.salary).toLocaleString('en-IN')}`
          : 'Not specified'}
      </p>
      <p>
        Experience: {job.experience_level || 'Not specified'}
      </p>
      <p>
        Job type: {job.job_type?.replace('_', ' ') || 'Not specified'}
      </p>
    </div>

    <span
      className={`recruiter-job-status ${
        job.is_active ? 'active' : 'inactive'
      }`}
    >
      {job.is_active ? 'Active' : 'Inactive'}
    </span>

    {/* Paste the buttons here */}
    <div className="my-job-actions">
        
        <button
        type="button"
        onClick={() => handleToggleStatus(job)}
        >
        {job.is_active ? 'Deactivate' : 'Activate'}
        </button>

      <button
        type="button"
        onClick={() => setEditingJob({ ...job })}
      >
        Edit
      </button>

      <button
        type="button"
        onClick={() => handleDeleteJob(job)}
      >
        Delete
      </button>
    </div>
  </article>
))}

        </div>
      )}
      
      {editingJob && (
        <div
          className="recruiter-modal-overlay"
          onClick={() => setEditingJob(null)}
        >
          <section
            className="recruiter-modal"
            role="dialog"
            aria-modal="true"
            onClick={event => event.stopPropagation()}
          >
            <button
              type="button"
              className="recruiter-modal-close"
              onClick={() => setEditingJob(null)}
            >
              ×
            </button>

            <h2>Edit Job</h2>

            <form onSubmit={handleEditSave}>
              <label>
                Job Title
                <input
                  required
                  value={editingJob.title || ''}
                  onChange={event =>
                    setEditingJob({
                      ...editingJob,
                      title: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Company
                <input
                  required
                  value={editingJob.company || ''}
                  onChange={event =>
                    setEditingJob({
                      ...editingJob,
                      company: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Location
                <input
                  required
                  value={editingJob.location || ''}
                  onChange={event =>
                    setEditingJob({
                      ...editingJob,
                      location: event.target.value,
                    })
                  }
                />
              </label>
                
<label>
  Job Description
  <textarea
    required
    rows={5}
    value={editingJob.description || ''}
    onChange={event =>
      setEditingJob({
        ...editingJob,
        description: event.target.value,
      })
    }
  />
</label>

            <label>
            Required Skills
            <textarea
                required
                rows={3}
                value={editingJob.required_skills || ''}
                onChange={event =>
                setEditingJob({
                    ...editingJob,
                    required_skills: event.target.value,
                })
                }
            />
            </label>

              <label>
                Salary
                <input
                  type="number"
                  min="0"
                  value={editingJob.salary ?? ''}
                  onChange={event =>
                    setEditingJob({
                      ...editingJob,
                      salary: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Experience Level
                <select
                  required
                  value={editingJob.experience_level || ''}
                  onChange={event =>
                    setEditingJob({
                      ...editingJob,
                      experience_level: event.target.value,
                    })
                  }
                >
                  
                <option value="">Select experience</option>
                <option value="fresher">Fresher</option>
                <option value="junior">Junior</option>
                <option value="mid_level">Mid Level</option>
                <option value="senior">Senior</option>

                </select>
              </label>

              <label>
                Job Type
                <select
                  required
                  value={editingJob.job_type || ''}
                  onChange={event =>
                    setEditingJob({
                      ...editingJob,
                      job_type: event.target.value,
                    })
                  }
                >
                  <option value="">Select job type</option>
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </label>

              <button
                className="recruiter-primary-button"
                type="submit"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </section>
        </div>
      )}

    </main>
  )
}

export default MyPostedJobs
