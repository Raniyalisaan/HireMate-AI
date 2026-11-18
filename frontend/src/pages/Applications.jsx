
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './Applications.css'

function Applications() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await api.get('applications/')
        const data = response.data

        setApplications(
          Array.isArray(data)
            ? data
            : Array.isArray(data.results)
              ? data.results
              : []
        )
      } catch (err) {
        console.error('Failed to fetch applications:', err)
        setError('Unable to load applications. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [])

  
const getRecruiter = (application) => {
  return {
    name:
      application.recruiter_name ||
      application.recruiter?.username ||
      'Recruiter details unavailable',

    photo:
      application.recruiter_photo ||
      application.recruiter?.profile_photo ||
      '',

    company:
      application.recruiter_company ||
      application.company ||
      'Not specified',
  }
}

  const getPhotoUrl = (photo) => {
    if (!photo) return ''
    if (photo.startsWith('http')) return photo

    return `http://127.0.0.1:8000${
      photo.startsWith('/') ? '' : '/'
    }${photo}`
  }

  const getInitials = (name) => {
    if (!name) return '?'

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }

  const formatDate = (date) => {
    if (!date) return 'Not available'

    const parsedDate = new Date(date)
    if (Number.isNaN(parsedDate.getTime())) return 'Not available'

    return parsedDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getStatusClass = (status) => {
    const normalized = (status || 'pending').toLowerCase()

    if (normalized.includes('accept') || normalized.includes('shortlist')) {
      return 'status-accepted'
    }

    if (normalized.includes('reject')) {
      return 'status-rejected'
    }

    if (
      normalized.includes('review') ||
      normalized.includes('interview')
    ) {
      return 'status-review'
    }

    return 'status-pending'
  }

  return (
    <div className="applications-page">
      <header className="applications-header">
        <div>
          <p className="applications-eyebrow">CAREER WORKSPACE</p>
          <h1>My Applications</h1>
          <p>Track your applications and recruiter updates in one place.</p>
        </div>

        <div className="applications-total">
          <span>Total Applications</span>
          <strong>{applications.length}</strong>
        </div>
      </header>

      <button
        type="button"
        className="applications-back-button"
        onClick={() => navigate('/dashboard')}
      >
        ← Back to Dashboard
      </button>

      {loading && (
        <p className="applications-message">Loading applications...</p>
      )}

      {error && (
        <p className="applications-error">{error}</p>
      )}

      {!loading && !error && applications.length === 0 && (
        <div className="applications-empty">
          <div className="applications-empty-icon">📨</div>
          <h2>No applications yet</h2>
          <p>Your submitted job applications will appear here.</p>
          <button type="button" onClick={() => navigate('/jobs')}>
            Explore Jobs →
          </button>
        </div>
      )}

      {!loading && !error && applications.length > 0 && (
        <section className="applications-table-card">
          <div className="applications-table-heading">
            <div>
              <h2>Application History</h2>
              <p>Review the jobs you have applied for.</p>
            </div>
          </div>

          <div className="applications-table-scroll">
            <table className="applications-table">
              <thead>
                <tr>
                  <th>Recruiter</th>
                  <th>Job Title</th>
                  <th>Company</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {applications.map((application) => {
                  const recruiter = getRecruiter(application)
                  const recruiterName = recruiter.name || 'Recruiter details unavailable'
                  const jobTitle =
                    application.job_title ||
                    application.job?.title ||
                    'Job Application'

                  return (
                    <tr key={application.id}>
                      <td>
                        <div className="recruiter-cell">
                          <div className="recruiter-avatar">
                            {recruiter.photo ? (
                              <img
                                src={getPhotoUrl(recruiter.photo)}
                                alt={recruiterName}
                              />
                            ) : (
                              getInitials(recruiter.name)
                            )}
                          </div>

                          <span className="recruiter-name">
                            {recruiterName}
                          </span>
                        </div>
                      </td>

                      <td className="application-job-title">
                        {jobTitle}
                      </td>

                      <td>{recruiter.company}</td>

                      <td>
                        {formatDate(
                          application.applied_at ||
                          application.created_at ||
                          application.created ||
                          application.date_applied
                        )}
                      </td>

                      <td>
                        <span
                          className={`application-status ${getStatusClass(application.status)}`}
                        >
                          {application.status || 'Pending'}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="application-view-button"
                          onClick={() => navigate('/jobs')}
                        >
                          View Jobs
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

export default Applications
