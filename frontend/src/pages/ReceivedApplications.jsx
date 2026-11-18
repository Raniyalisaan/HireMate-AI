
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './RecruiterPages.css'

function ReceivedApplications() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resumeLoadingId, setResumeLoadingId] = useState(null)

  useEffect(() => {
    const fetchApplications = async () => {
      if (!localStorage.getItem('accessToken')) {
        navigate('/login')
        return
      }

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
        console.error('Applications error:', err.response?.data || err)
        setError(
          err.response?.status === 401
            ? 'Session expired. Please log in again.'
            : 'Could not load applications.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [navigate])

  const updateStatus = async (application, newStatus) => {
    try {
      await api.patch(
        `applications/${application.id}/status/`,
        { status: newStatus }
      )

      setApplications(previous =>
        previous.map(item =>
          item.id === application.id
            ? { ...item, status: newStatus }
            : item
        )
      )

      setSelectedApplication(previous =>
        previous?.id === application.id
          ? { ...previous, status: newStatus }
          : previous
      )
    } catch (err) {
      console.error('Status update error:', err.response?.data || err)
      alert('Could not update status. Please try again.')
    }
  }
  
  
const handleResume = async (application, action = 'view') => {
  let pdfUrl = null
  let pdfWindow = null

  try {
    setResumeLoadingId(application.id)

    // Open a blank tab immediately for the view action.
    if (action === 'view') {
      pdfWindow = window.open('', '_blank')

      if (!pdfWindow) {
        alert('Please allow pop-ups in your browser to view the resume.')
        return
      }

      pdfWindow.document.title = 'Loading resume...'
      pdfWindow.document.body.innerText = 'Loading candidate resume...'
    }

    const response = await api.get(
      `applications/${application.id}/resume/`,
      { responseType: 'blob' }
    )

    pdfUrl = window.URL.createObjectURL(
      new Blob([response.data], { type: 'application/pdf' })
    )

    if (action === 'view') {
      pdfWindow.location.href = pdfUrl
      pdfWindow = null
    } else {
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `candidate-${application.id}-resume.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
    }

    // Keep the Blob URL alive briefly for the browser to load the PDF.
    window.setTimeout(() => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl)
      }
    }, 60000)
  } catch (err) {
    console.error('Resume error:', err.response?.status, err)

    if (pdfWindow && !pdfWindow.closed) {
      pdfWindow.close()
    }

    if (err.response?.status === 404) {
      alert('No resume was found for this candidate.')
    } else if (err.response?.status === 401) {
      alert('Your session may have expired. Please log in again.')
      navigate('/login')
    } else if (err.response?.status === 403) {
      alert('You are not authorized to view this resume.')
    } else {
      alert('Could not open the resume. Please try again.')
    }
  } finally {
    setResumeLoadingId(null)
  }
}


  const getInitials = application => {
    const name =
      application.applicant_name ||
      application.applicant_username ||
      'Applicant'

    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase()
  }

  const getPhoto = application =>
    application.applicant_photo || null

  return (
    <main className="recruiter-page received-page">
      <header className="recruiter-page-header">
        <div>
          <p className="recruiter-eyebrow">RECRUITER WORKSPACE</p>
          <h1>Received Applications</h1>
          <p>Review candidates and manage their application status.</p>
        </div>
      </header>

      <button
        className="recruiter-back-button"
        onClick={() => navigate('/')}
      >
        ← Back to Home
      </button>

      {!loading && !error && (
        <div className="received-table-summary">
          <div>
            <span>Total applications</span>
            <strong>{applications.length}</strong>
          </div>
          <div>
            <span>Pending review</span>
            <strong>
              {applications.filter(
                item => !item.status || item.status === 'pending'
              ).length}
            </strong>
          </div>
        </div>
      )}

      {loading ? (
        <p className="recruiter-message">Loading applications...</p>
      ) : error ? (
        <div className="recruiter-error">{error}</div>
      ) : applications.length === 0 ? (
        <div className="recruiter-empty">
          <h2>No applications yet</h2>
          <p>Applications for your posted jobs will appear here.</p>
        </div>
      ) : (
        <div className="received-table-wrapper">
          <table className="received-applications-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Applied For</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>

            <tbody>
              {applications.map(application => (
                <tr key={application.id}>
                  <td>
                    <div className="received-applicant-cell">
                      {getPhoto(application) ? (
                        <img
                          className="received-applicant-avatar"
                          src={getPhoto(application)}
                          alt={application.applicant_name || 'Applicant'}
                        />
                      ) : (
                        <div className="received-applicant-avatar received-avatar-fallback">
                          {getInitials(application)}
                        </div>
                      )}

                      <div className="received-applicant-info">
                        <strong>
                          {application.applicant_name ||
                            application.applicant_username ||
                            'Applicant'}
                        </strong>
                        <span>
                          {application.applicant_email || 'Email unavailable'}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <strong className="received-job-title">
                      {application.job_title || 'Job unavailable'}
                    </strong>
                    <span className="received-company-name">
                      {application.company || ''}
                    </span>
                  </td>

                  <td>
                    {application.applied_at
                      ? new Date(application.applied_at).toLocaleDateString()
                      : '—'}
                  </td>

                  <td>
                    <select
                      className="received-status-select"
                      aria-label={`Status for application ${application.id}`}
                      value={application.status || 'pending'}
                      onChange={event =>
                        updateStatus(application, event.target.value)
                      }
                    >
                      <option value="pending">Pending</option>
                      <option value="under_review">Under Review</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="rejected">Rejected</option>
                      <option value="hired">Hired</option>
                    </select>
                  </td>

                  <td>
                    <button
                      className="received-view-button"
                      onClick={() => setSelectedApplication(application)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedApplication && (
        <div
          className="recruiter-modal-overlay"
          onClick={() => setSelectedApplication(null)}
        >
          <section
            className="recruiter-modal received-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="received-detail-title"
            onClick={event => event.stopPropagation()}
          >
            <button
              className="recruiter-modal-close"
              onClick={() => setSelectedApplication(null)}
              aria-label="Close details"
            >
              ×
            </button>

            <p className="recruiter-eyebrow">CANDIDATE PROFILE</p>

            <div className="received-detail-heading">
              {getPhoto(selectedApplication) ? (
                <img
                  className="received-applicant-avatar received-avatar-large"
                  src={getPhoto(selectedApplication)}
                  alt={selectedApplication.applicant_name || 'Applicant'}
                />
              ) : (
                <div className="received-applicant-avatar received-avatar-fallback received-avatar-large">
                  {getInitials(selectedApplication)}
                </div>
              )}

              <div>
                <h2 id="received-detail-title">
                  {selectedApplication.applicant_name ||
                    selectedApplication.applicant_username ||
                    'Applicant'}
                </h2>
                <p>{selectedApplication.applicant_email || 'Email unavailable'}</p>
                <p>{selectedApplication.applicant_location || 'Location not provided'}</p>
              </div>
            </div>

            <div className="received-detail-section">
              <h3>Application</h3>
              <p>
                <strong>Job:</strong>{' '}
                {selectedApplication.job_title || 'Not available'}
              </p>
              <p>
                <strong>Company:</strong>{' '}
                {selectedApplication.company || 'Not available'}
              </p>
              <p>
                <strong>Applied:</strong>{' '}
                {selectedApplication.applied_at
                  ? new Date(selectedApplication.applied_at).toLocaleDateString()
                  : 'Not available'}
              </p>
            </div>

            <div className="received-detail-section">
              <h3>About the Candidate</h3>
              <p>
                {selectedApplication.applicant_bio ||
                  'No profile summary provided.'}
              </p>
            </div>

            <div className="received-detail-section">
              <h3>Skills</h3>
              <p>
                {selectedApplication.applicant_skills ||
                  'Skills not provided.'}
              </p>
            </div>

            <div className="received-detail-section">
              <h3>Education</h3>
              <p>
                {selectedApplication.applicant_education ||
                  'Education not provided.'}
              </p>
            </div>

            <div className="received-detail-section">
              <h3>Experience</h3>
              <p>
                {selectedApplication.applicant_experience ||
                  'Experience not provided.'}
              </p>
            </div>

            <div className="received-detail-section">
              <h3>Cover Letter</h3>
              <p>
                {selectedApplication.cover_letter?.trim() ||
                  'No cover letter provided.'}
              </p>
            </div>
            
            
<div className="received-detail-section">
  <h3>Candidate Resume</h3>
  <p>
    View or download the candidate's latest uploaded resume.
  </p>

  <div className="received-resume-actions">
    <button
      type="button"
      className="received-view-button"
      disabled={resumeLoadingId === selectedApplication.id}
      onClick={() => handleResume(selectedApplication, 'view')}
    >
      {resumeLoadingId === selectedApplication.id
        ? 'Loading...'
        : 'View Resume'}
    </button>

    <button
      type="button"
      className="recruiter-primary-button"
      disabled={resumeLoadingId === selectedApplication.id}
      onClick={() => handleResume(selectedApplication, 'download')}
    >
      {resumeLoadingId === selectedApplication.id
        ? 'Loading...'
        : 'Download Resume'}
    </button>
  </div>
</div>


            {selectedApplication.applicant_portfolio && (
              <div className="received-detail-section">
                <h3>Portfolio</h3>
                <a
                  href={selectedApplication.applicant_portfolio}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Portfolio ↗
                </a>
              </div>
            )}

            <label className="received-detail-status">
              Update Application Status
              <select
                className="received-status-select"
                value={selectedApplication.status || 'pending'}
                onChange={event =>
                  updateStatus(selectedApplication, event.target.value)
                }
              >
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
              </select>
            </label>

            <button
              className="recruiter-primary-button"
              onClick={() => setSelectedApplication(null)}
            >
              Close Details
            </button>
          </section>
        </div>
      )}
    </main>
  )
}

export default ReceivedApplications
