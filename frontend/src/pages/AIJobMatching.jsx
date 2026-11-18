
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './AIJobMatching.css'

function AIJobMatching() {
  const [resumes, setResumes] = useState([])
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [matches, setMatches] = useState([])
  const [loadingResumes, setLoadingResumes] = useState(true)
  const [matching, setMatching] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const response = await api.get('resumes/')
        const data = response.data
        const resumeList = Array.isArray(data)
          ? data
          : data.results || []

        setResumes(resumeList)

        if (resumeList.length > 0) {
          setSelectedResumeId(String(resumeList[0].id))
        }
      } catch (err) {
        console.error(
          'Resume loading error:',
          err.response?.data || err.message
        )
        setError('Unable to load your resumes. Please try again.')
      } finally {
        setLoadingResumes(false)
      }
    }

    fetchResumes()
  }, [])

  const handleFindMatches = async (event) => {
    event.preventDefault()

    if (!selectedResumeId) {
      setError('Please upload and select a resume first.')
      return
    }

    setMatching(true)
    setError('')
    setMessage('')
    setMatches([])

    try {
      const response = await api.post('resumes/match-jobs/', {
        resume_id: Number(selectedResumeId),
      })

      const data = response.data
      setMatches(data.matches || [])

      if (!data.matches?.length) {
        setMessage('No active jobs are available right now.')
      }
    } catch (err) {
      console.error(
        'Job matching error:',
        err.response?.data || err.message
      )

      setError(
        err.response?.data?.error ||
        'Unable to match jobs. Please try again.'
      )
    } finally {
      setMatching(false)
    }
  }

  return (
    <main className="ai-matching-page">
      <header className="ai-matching-header">
        <button
          type="button"
          className="ai-matching-back"
          onClick={() => navigate('/')}
        >
          ← Home
        </button>

        <span className="ai-matching-eyebrow">
          HIREMATE AI CAREER TOOLS
        </span>

        <h1>AI Job Matching</h1>

        <p>
          Discover opportunities based on the skills in your resume.
        </p>
      </header>

      <section className="ai-matching-selector">
        <form onSubmit={handleFindMatches}>
          <label htmlFor="matching-resume">
            Select your resume
          </label>

          <select
            id="matching-resume"
            value={selectedResumeId}
            onChange={(event) => setSelectedResumeId(event.target.value)}
            disabled={loadingResumes || resumes.length === 0 || matching}
            required
          >
            <option value="">
              {loadingResumes
                ? 'Loading resumes...'
                : resumes.length === 0
                  ? 'No resumes uploaded'
                  : 'Choose a resume'}
            </option>

            {resumes.map((resume) => (
              <option key={resume.id} value={String(resume.id)}>
                {resume.title || 'My Resume'}
              </option>
            ))}
          </select>

          {resumes.length === 0 && !loadingResumes && (
            <button
              type="button"
              className="ai-matching-primary"
              onClick={() => navigate('/resume-upload')}
            >
              Upload Resume
            </button>
          )}

          <button
            type="submit"
            className="ai-matching-primary"
            disabled={matching || loadingResumes || resumes.length === 0}
          >
            {matching ? 'Finding Matches...' : 'Find Matching Jobs'}
          </button>
        </form>
      </section>

      {error && (
        <p className="ai-matching-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="ai-matching-message" role="status">
          {message}
        </p>
      )}

      {matches.length > 0 && (
        <section className="ai-matching-results">
          <div className="ai-matching-results-heading">
            <h2>Your Job Matches</h2>
            <p>
              {matches.length} matching opportunities, ranked by skill match.
            </p>
          </div>

          {matches.map((job) => (
            <article className="ai-match-card" key={job.job_id}>
              <div className="ai-match-card-top">
                <div>
                  <h3>{job.title}</h3>
                  <p className="ai-match-company">{job.company}</p>
                  <p className="ai-match-location">
                    📍 {job.location || 'Location not specified'}
                  </p>
                </div>

                <div className="ai-match-score">
                  <strong>{job.match_percentage}%</strong>
                  <span>Skill match</span>
                </div>
              </div>

              <div className="ai-match-progress">
                <div
                  className="ai-match-progress-fill"
                  style={{
                    width: `${job.match_percentage}%`,
                  }}
                />
              </div>

              <div className="ai-match-meta">
                <span>
                  {String(job.job_type || '').replaceAll('_', ' ')}
                </span>
                <span>
                  {String(job.experience_level || '').replaceAll('_', ' ')}
                </span>
                {job.salary && (
                  <span>₹{Number(job.salary).toLocaleString('en-IN')}</span>
                )}
              </div>

              <div className="ai-match-skills">
                <h4>Matched Skills ({job.matched_skills.length})</h4>

                {job.matched_skills.length > 0 ? (
                  <div className="ai-match-skill-tags">
                    {job.matched_skills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                ) : (
                  <p>No required skills matched yet.</p>
                )}
              </div>

              <div className="ai-match-skills missing">
                <h4>Skills to Improve ({job.missing_skills.length})</h4>

                {job.missing_skills.length > 0 ? (
                  <div className="ai-match-skill-tags">
                    {job.missing_skills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                ) : (
                  <p>All listed required skills were found in your resume.</p>
                )}
              </div>

              <button
                type="button"
                className="ai-matching-apply"
                onClick={() =>
                  navigate('/jobs', {
                    state: { applyForJobId: job.job_id },
                  })
                }
              >
                View Job & Apply →
              </button>
            </article>
          ))}
        </section>
      )}

      <p className="ai-matching-disclaimer">
        Match percentages are estimates based on text matches between your
        resume and the listed job skills. They do not guarantee selection.
      </p>
    </main>
  )
}

export default AIJobMatching
