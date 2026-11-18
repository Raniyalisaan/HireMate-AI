
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'
import './JobDetails.css'

function JobDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`jobs/${id}/`)
        setJob(response.data)
      } catch (err) {
        console.error(
          'Job details error:',
          err.response?.data || err.message
        )
        setError('Unable to load job details. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [id])

  if (loading) {
    return <div className="job-details-message">Loading job details...</div>
  }

  if (error || !job) {
    return (
      <div className="job-details-message">
        <p>{error || 'Job not found.'}</p>
        <button onClick={() => navigate('/jobs')}>
          Back to Find Jobs
        </button>
      </div>
    )
  }

  const skills = (job.required_skills || '')
    .split(/[,;\n]/)
    .map((skill) => skill.trim())
    .filter(Boolean)

  return (
    <div className="job-details-page">
      <header className="job-details-header">
        <button onClick={() => navigate('/jobs')}>
          ← Back to Find Jobs
        </button>
        <span>HIREMATE AI CAREER PORTAL</span>
      </header>

      <main className="job-details-container">
        <section className="job-details-card">
          <div className="job-details-company">
            {job.recruiter_photo ? (
              <img
                src={job.recruiter_photo}
                alt="Recruiter profile"
              />
            ) : (
              <div className="job-details-company-fallback">
                {(job.company || 'C').charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <h1>{job.title}</h1>
              <p>{job.company || 'Company not specified'}</p>
              <small>
                Posted by {job.recruiter_username || 'Recruiter'}
              </small>
            </div>
          </div>

          <div className="job-details-meta">
            <span>📍 {job.location || 'Location not specified'}</span>
            <span>
              💰 {job.salary
                ? `₹${Number(job.salary).toLocaleString('en-IN')} / month`
                : 'Salary not specified'}
            </span>
            <span>
              🎯 {(job.experience_level || 'Not specified').replace('_', ' ')}
            </span>
            <span>
              💼 {(job.job_type || 'Not specified').replace('_', ' ')}
            </span>
          </div>

          <hr />

          <h2>Job Description</h2>
          <p className="job-details-description">
            {job.description || 'No description provided.'}
          </p>

          <h2>Required Skills</h2>
          <div className="job-details-skills">
            {skills.length ? (
              skills.map((skill, index) => (
                <span key={index}>{skill}</span>
              ))
            ) : (
              <p>Skills not specified.</p>
            )}
          </div>

          <button
            className="job-details-apply"
            onClick={() =>
                navigate('/jobs', {
                state: { applyForJobId: Number(job.id) },
                })
            }
            >
            Go to Apply for This Job →
            </button>
        </section>
      </main>
    </div>
  )
}

export default JobDetails
