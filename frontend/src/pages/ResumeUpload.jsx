
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './ResumeUpload.css'

function ResumeUpload() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('My Resume')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [resumes, setResumes] = useState([])
  const [fetching, setFetching] = useState(true)
  const [analyzingId, setAnalyzingId] = useState(null)
  const [analysisResults, setAnalysisResults] = useState({})
  const [analysisError, setAnalysisError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [resumeToDelete, setResumeToDelete] = useState(null)

  const getResumeUrl = (fileUrl) => {
    if (!fileUrl) return ''

    if (fileUrl.startsWith('http://') ||
        fileUrl.startsWith('https://')) {
      return fileUrl
    }

    const baseURL = api.defaults.baseURL

    if (!baseURL) return fileUrl

    return new URL(fileUrl, baseURL).href
  }

  
const fetchResumes = useCallback(async () => {
  const token = localStorage.getItem('accessToken')

  if (!token) {
    setFetching(false)
    navigate('/login')
    return
  }

  try {
    setFetching(true)
    setError('')

    const response = await api.get('resumes/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = response.data

    const resumeList = Array.isArray(data)
      ? data
      : Array.isArray(data.results)
        ? data.results
        : []

    setResumes(resumeList)
  } catch (err) {
    console.error(
      'Fetching resumes failed:',
      err.response?.data || err
    )

    setError('Unable to load your resumes. Please try again.')
  } finally {
    setFetching(false)
  }
}, [navigate])


  useEffect(() => {
    fetchResumes()
  }, [fetchResumes])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    const token = localStorage.getItem('accessToken')

    if (!token) {
      navigate('/login')
      return
    }

    if (!file) {
      setError('Please select a PDF resume.')
      return
    }

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.')
      return
    }

    const formData = new FormData()
    formData.append('title', title)
    formData.append('resume_file', file)

    setLoading(true)

    try {
      await api.post('resumes/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setMessage('Resume uploaded successfully!')
      setFile(null)
      setTitle('My Resume')
      event.target.reset()

      await fetchResumes()
    } catch (err) {
      console.error(
        'Resume upload error:',
        err.response?.data || err
      )

      setError(
        err.response?.data?.detail ||
        'Resume upload failed. Please check the backend API.'
      )
    } finally {
      setLoading(false)
    }
  }

  
const handleAnalyze = async (resumeId) => {
  // If this resume's analysis is already visible, close it.
  if (analysisResults[resumeId]) {
    setAnalysisResults((previous) => {
      const updated = { ...previous }
      delete updated[resumeId]
      return updated
    })
    setAnalysisError('')
    return
  }

  setAnalyzingId(resumeId)
  setAnalysisError('')
  setMessage('')

  try {
    const response = await api.post('resumes/analyze/', {
      resume_id: resumeId,
    })

    setAnalysisResults((previous) => ({
      ...previous,
      [resumeId]: response.data.analysis,
    }))
  } catch (err) {
    console.error(
      'Resume analysis failed:',
      err.response?.data || err
    )

    setAnalysisError(
      err.response?.data?.error ||
      'Resume analysis failed. Please try again.'
    )
  } finally {
    setAnalyzingId(null)
  }
}

const handleDeleteResume = async (resumeId) => {
  

  setDeletingId(resumeId)
  setError('')
  setMessage('')
  setAnalysisError('')

  try {
    await api.delete(`resumes/${resumeId}/`)

    setResumes((previous) =>
      previous.filter((resume) => resume.id !== resumeId)
    )

    setAnalysisResults((previous) => {
      const updated = { ...previous }
      delete updated[resumeId]
      return updated
    })

    setMessage('Resume deleted successfully.')
  } catch (err) {
    console.error(
      'Resume delete failed:',
      err.response?.data || err.message
    )

    setError(
      err.response?.data?.error ||
      err.response?.data?.detail ||
      'Unable to delete this resume.'
    )
  } finally {
    setDeletingId(null)
  }
}

  return (
    <div className="resume-upload-page">
      <div className="resume-upload-card">
        <button
          type="button"
          className="resume-back-button"
          onClick={() => navigate('/dashboard')}
        >
          ← Back to Dashboard
        </button>

        <div className="resume-heading">
          <div className="resume-icon">📄</div>
          <p className="resume-eyebrow">CAREER TOOLKIT</p>
          <h1>Upload Your Resume</h1>
          <p>
            Upload your latest resume and get ready for your next
            career opportunity.
          </p>
        </div>

        {message && (
          <div className="resume-message resume-success">
            {message}
          </div>
        )}

        {error && (
          <div className="resume-message resume-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="resume-title">Resume Title</label>
          <input
            id="resume-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Python Developer Resume"
            required
          />

          <label htmlFor="resume-file">Choose PDF Resume</label>

          <div className="resume-file-box">
            <span className="resume-file-icon">☁️</span>
            <p>Select your resume in PDF format</p>

            <input
              id="resume-file"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null)
                setMessage('')
                setError('')
              }}
              required
            />

            {file && (
              <p className="selected-resume">
                Selected: {file.name}
              </p>
            )}
          </div>

          <button
            className="resume-submit-button"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Upload Resume'}
          </button>
        </form>

        <p className="resume-note">
          PDF files only. Your resume is stored with your account.
        </p>

        {/* Uploaded resumes section */}
        <div className="uploaded-resumes">
          <h2>My Uploaded Resumes</h2>

          {fetching ? (
            <p>Loading your resumes...</p>
          ) : resumes.length === 0 ? (
            <p>No resumes found. Upload your first resume above.</p>
          ) : (
            <div className="resume-list">
              {resumes.map((resume) => (
                <div className="resume-item" key={resume.id}>
                  <div className="resume-item-info">
                    <span className="resume-item-icon">📄</span>
                    <div>
                      <h3>{resume.title || 'My Resume'}</h3>
                      <p>
                        {resume.resume_file
                          ? resume.resume_file.split('/').pop()
                          : 'PDF file'}
                      </p>
                    </div>
                  </div>

                  {resume.resume_file && (
                    <a
                      className="resume-view-button"
                      href={getResumeUrl(resume.resume_file)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View PDF ↗
                    </a>
                  )}
                  <button
                    type="button"
                    className="resume-submit-button"
                    onClick={() => handleAnalyze(resume.id)}
                    disabled={analyzingId === resume.id}
                  >
                    {analyzingId === resume.id
                      ? 'Analyzing...'
                      : analysisResults[resume.id]
                        ? 'Close Analysis'
                        : 'Analyze Resume'}
                  </button>
                 <button
                    type="button"
                    className="resume-delete-button"
                    onClick={() => {
                      setResumeToDelete(resume)
                      setShowDeleteModal(true)
                    }}
                    disabled={deletingId === resume.id}
                  >
                    Delete Resume
                  </button>
                  {analysisError && (
                    <p className="resume-error">{analysisError}</p>
                  )}

                  {analysisResults[resume.id] && (
                    <div className="resume-analysis-result">
                      <h3>Resume Analysis</h3>
                  
                    <div className="resume-score-section">
                      <div className="resume-score-header">
                        <div>
                          <h4>Resume Completeness</h4>
                          <p>Based on detected skills and resume sections</p>
                        </div>

                        <div className="resume-score-value">
                          {analysisResults[resume.id].score ?? 0}%
                        </div>
                      </div>

                      <div className="resume-score-track">
                        <div
                          className="resume-score-progress"
                          style={{
                            width: `${analysisResults[resume.id].score ?? 0}%`,
                          }}
                        />
                      </div>

                      <span className="resume-score-label">
                        {analysisResults[resume.id].score_label ?? 'Analysis complete'}
                      </span>
                    </div>

                      
                      <div className="detected-skills-section">
                        <strong>Skills Detected</strong>

                        <div className="detected-skills-list">
                          {analysisResults[resume.id].detected_skills.length > 0 ? (
                            analysisResults[resume.id].detected_skills.map((skill, index) => (
                              <span className="detected-skill-badge" key={index}>
                                {skill}
                              </span>
                            ))
                          ) : (
                            <p>No matching skills detected.</p>
                          )}
                        </div>
                      </div>

                       
                      <p>
                        <strong>Skill count:</strong>{' '}
                        {analysisResults[resume.id].skill_count}
                      </p>

                      <h4>Suggestions</h4>
                      <ul>
                        {analysisResults[resume.id].suggestions.map(
                          (suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    
          {/* Delete Confirmation Modal */}
      {showDeleteModal && resumeToDelete && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <div className="delete-modal-icon">!</div>

            <h2>Delete Resume?</h2>

            <p>
              Are you sure you want to delete
              <strong> {resumeToDelete.title}</strong>?
              This action cannot be undone.
            </p>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="delete-cancel-button"
                onClick={() => {
                  setShowDeleteModal(false)
                  setResumeToDelete(null)
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-confirm-button"
                onClick={async () => {
                  const resumeId = resumeToDelete.id
                  setShowDeleteModal(false)
                  setResumeToDelete(null)
                  await handleDeleteResume(resumeId)
                }}
                disabled={deletingId !== null}
              >
                {deletingId !== null ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

  )
}

export default ResumeUpload