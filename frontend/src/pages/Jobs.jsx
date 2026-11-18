
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api'
import './Jobs.css'

function Jobs() {
  const [jobs, setJobs] = useState([])
  const [savedJobs, setSavedJobs] = useState([])
  const [appliedJobIds, setAppliedJobIds] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [savingJobId, setSavingJobId] = useState(null)

  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [experience, setExperience] = useState('')
  const [jobType, setJobType] = useState('')

  const [applyingJobId, setApplyingJobId] = useState(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [resumes, setResumes] = useState([])
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [loadingResumes, setLoadingResumes] = useState(false)
  const [submittingApplication, setSubmittingApplication] = useState(false)

  const navigate = useNavigate()
  const locationState = useLocation()

  useEffect(() => {
  const jobId = locationState.state?.applyForJobId

  if (jobId) {
    setApplyingJobId(Number(jobId))
    setCoverLetter('')
  }
}, [locationState.state])

  const token = localStorage.getItem('accessToken')
  const role = localStorage.getItem('role') || 'job_seeker'
  const isJobSeeker = role === 'job_seeker'

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await api.get('jobs/')
        const data = response.data
        setJobs(Array.isArray(data) ? data : data.results || [])
      } catch (err) {
        console.error('Jobs API error:', err.response?.data || err.message)
        setError('Failed to load jobs. Please login again to continue.')
      } finally {
        setLoading(false)
      }
    }

    const fetchSavedJobs = async () => {
      if (!token || !isJobSeeker) return

      try {
        const response = await api.get('jobs/saved/')
        const data = response.data
        setSavedJobs(Array.isArray(data) ? data : data.results || [])
      } catch (err) {
        console.error('Saved jobs API error:', err.response?.data || err.message)
      }
    }
    
const fetchAppliedJobs = async () => {
  if (!token || !isJobSeeker) return

  try {
    const response = await api.get('applications/')
    const data = response.data
    const applications = Array.isArray(data)
      ? data
      : data.results || []

    setAppliedJobIds(
      applications.map((application) =>
        Number(application.job)
      )
    )
  } catch (err) {
    console.error(
      'Applied jobs API error:',
      err.response?.data || err.message
    )
  }
}

    fetchJobs()
    fetchSavedJobs()
    fetchAppliedJobs()
  }, [token, isJobSeeker])

  useEffect(() => {
  const fetchResumes = async () => {
    if (!token || !isJobSeeker) return

    try {
      setLoadingResumes(true)

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
        'Fetch resumes error:',
        err.response?.data || err.message
      )
      setMessage('Unable to load your resumes. Please try again.')
    } finally {
      setLoadingResumes(false)
    }
  }

  fetchResumes()
}, [token, isJobSeeker])

 const filteredJobs = useMemo(() => {
  const normalizedSearch = search.trim().toLowerCase()
  const normalizedLocation = location.trim().toLowerCase()

  return jobs.filter((job) => {
    const searchText = [
      job.title,
      job.company,
      job.required_skills,
      job.description,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const matchesSearch =
      normalizedSearch === '' ||
      searchText.includes(normalizedSearch)

    const matchesLocation = (job.location || '')
      .toLowerCase()
      .includes(normalizedLocation)

    const matchesExperience =
      !experience || job.experience_level === experience
   
      const matchesJobType =
      !jobType || job.job_type === jobType

    return (
      matchesSearch &&
      matchesLocation &&
      matchesExperience &&
      matchesJobType &&
      job.is_active !== false
    )
  })
}, [jobs, search, location, experience,jobType])

  const getSavedJob = (jobId) => {
    return savedJobs.find((item) => {
      const savedJobId = item.job_details?.id ?? item.job
      return Number(savedJobId) === Number(jobId)
    })
  }

  const handleSaveJob = async (jobId) => {
    if (!token) {
      navigate('/login')
      return
    }

    if (!isJobSeeker) {
      setMessage('Only job seekers can save jobs.')
      return
    }

    setSavingJobId(jobId)
    setMessage('')

    try {
      const response = await api.post('jobs/saved/', { job: jobId })

      setSavedJobs((previous) => {
        const alreadySaved = previous.some((item) => {
          const savedId = item.job_details?.id ?? item.job
          return Number(savedId) === Number(jobId)
        })

        return alreadySaved ? previous : [...previous, response.data]
      })

      setMessage('Job saved successfully.')
    } catch (err) {
      console.error('Save job error:', err.response?.data || err.message)

      if (err.response?.status === 403) {
        setMessage('Only job seekers can save jobs.')
      } else if (err.response?.status === 401) {
        setMessage('Your session has expired. Please log in again.')
      } else {
        setMessage('Unable to save this job. It may already be saved.')
      }
    } finally {
      setSavingJobId(null)
    }
  }

  const handleRemoveSavedJob = async (savedJobId) => {
    setSavingJobId(savedJobId)
    setMessage('')

    try {
      await api.delete(`jobs/saved/${savedJobId}/`)

      setSavedJobs((previous) =>
        previous.filter((item) => item.id !== savedJobId)
      )

      setMessage('Saved job removed successfully.')
    } catch (err) {
      console.error('Remove saved job error:', err.response?.data || err.message)
      setMessage('Unable to remove this saved job. Please try again.')
    } finally {
      setSavingJobId(null)
    }
  }

  const handleApply = async (event, jobId) => {
    event.preventDefault()
    if (!isJobSeeker) {
      setMessage('Please log in with a Job Seeker account to apply.')
      return
    }
    if (resumes.length === 0) {
  setMessage('Please upload a PDF resume before applying.')
  return
}

    if (!selectedResumeId) {
      setMessage('Please select a resume before applying.')
      return
    }

    if (!token) {
      navigate('/login')
      return
    }

    if (!isJobSeeker) {
      setMessage('Please log in with a Job Seeker account to apply.')
      return
    }

    setSubmittingApplication(true)
    setMessage('')

    try {
      await api.post('applications/', {
        job: jobId,
        resume: Number(selectedResumeId),
        cover_letter: coverLetter.trim(),
      })

      setMessage('Application submitted successfully!')
      setApplyingJobId(null)
      setCoverLetter('')

      setAppliedJobIds((previous) =>
  [...new Set([...previous, Number(jobId)])]
)
    } catch (err) {
      console.error('Application error:', err.response?.data || err.message)

      if (err.response?.status === 401) {
        setMessage('Your session has expired. Please log in again.')
      } else if (err.response?.status === 403) {
        setMessage('Only job seekers can apply for jobs.')
      } else if (err.response?.status === 400) {
        const details = err.response?.data
        setMessage(
          details?.detail ||
            details?.non_field_errors?.[0] ||
            'Could not submit application. You may have already applied.'
        )
      } else {
        setMessage('Unable to submit application. Please try again.')
      }
    } finally {
      setSubmittingApplication(false)
    }
  }

  return (
    <div className="jobs-page">
      <header className="jobs-header">
        <button
          className="jobs-back-button"
          type="button"
          onClick={() => navigate('/dashboard')}
        >
          ← Dashboard
        </button>

        <span className="jobs-eyebrow">HIREMATE AI CAREER PORTAL</span>
        <h1>Find Your Next Opportunity</h1>
        <p>Discover jobs that match your skills and career goals.</p>
      </header>

      <section className="jobs-search-panel">
        <div className="jobs-search-field">
          <label htmlFor="job-search">Job title, skills, or company</label>
          <input
            id="job-search"
            type="search"
            placeholder="e.g. Python Developer"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="jobs-search-field">
          <label htmlFor="job-location">Location</label>
          <input
            id="job-location"
            type="search"
            placeholder="e.g. Calicut, Kerala"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
        </div>

        <div className="jobs-search-field">
          <label htmlFor="job-experience">Experience level</label>
          <select
            id="job-experience"
            value={experience}
            onChange={(event) => setExperience(event.target.value)}
          >
            <option value="">All experience levels</option>
            <option value="fresher">Fresher</option>
            <option value="junior">Junior</option>
            <option value="mid_level">Mid Level</option>
            <option value="senior">Senior</option>
          </select>
        </div>

          
<div className="jobs-search-field">
  <label htmlFor="job-type">Job type</label>
  <select
    id="job-type"
    value={jobType}
    onChange={(event) => setJobType(event.target.value)}
  >
    <option value="">All job types</option>
    <option value="full_time">Full-time</option>
    <option value="part_time">Part-time</option>
    <option value="internship">Internship</option>
    <option value="contract">Contract</option>
  </select>
</div>


        <button
          className="jobs-search-button"
          type="button"
          onClick={() => {
            // Filters update automatically as you type.
          }}
        >
          Search Jobs
        </button>
      </section>

      {message && (
        <p
          className={`jobs-feedback ${
            message.toLowerCase().includes('successfully')
              ? 'success'
              : 'error'
          }`}
          role="status"
        >
          {message}
        </p>
      )}

      <section className="jobs-results-heading">
        <div>
          <h2>Available Opportunities</h2>
          <p>Explore your next career move.</p>
        </div>
        {!loading && (
          <span className="jobs-result-count">
            {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} found
          </span>
        )}
      </section>

      {loading && <p className="jobs-empty">Loading jobs...</p>}
      {error && <p className="jobs-feedback error" role="alert">{error}</p>}

      {!loading && !error && filteredJobs.length === 0 && (
        <div className="jobs-empty">
          <h3>No matching jobs found</h3>
          <p>Try another job title, skill, or location.</p>
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setLocation('')
              setExperience('')
              setJobType('')
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      <div className="jobs-list">
        {filteredJobs.map((job) => {
          const savedJob = getSavedJob(job.id)
          const skills = (job.required_skills || '')
            .split(/[,;\n]/)
            .map((skill) => skill.trim())
            .filter(Boolean)

          return (
            <article className="job-card" key={job.id}>
              <div className="job-card-top">
               
<div className="job-company-icon">
  {job.recruiter_photo ? (
    <img
      src={job.recruiter_photo}
      alt={`${job.recruiter_username || 'Recruiter'} profile`}
      className="job-recruiter-photo"
    />
  ) : (
    (job.company || 'C').charAt(0).toUpperCase()
  )}
</div>


                <div className="job-card-title">
                  <h3>{job.title}</h3>
                  <p className="job-company">
                    {job.company || 'Company not specified'}</p>
                  
                  <p className="job-recruiter">
                    <span>Posted by </span>
                    <strong>{job.recruiter_username || 'Recruiter'}</strong>
                  </p>

                </div>

                <span className="job-type-badge">
                  {(job.job_type || 'full_time').replace('_', ' ')}
                </span>
              </div>

              <div className="job-meta">
                <span>📍 {job.location || 'Location not specified'}</span>
                <span>
                  💰 {job.salary ? `₹${Number(job.salary).toLocaleString('en-IN')}` : 'Salary not specified'}
                  {job.salary ? ' / month' : ''}
                </span>
                <span>🎯 {(job.experience_level || 'Not specified').replace('_', ' ')}</span>
              </div>

              {job.description && (
                <p className="job-description">{job.description}</p>
              )}

              <div className="job-skills">
                <strong>Required skills</strong>
                <div className="job-skill-tags">
                  {skills.length ? (
                    skills.map((skill, index) => (
                      <span key={`${job.id}-${index}`}>{skill}</span>
                    ))
                  ) : (
                    <span>Skills not specified</span>
                  )}
                </div>
              </div>
<div className="job-card-actions">
  <button
    className="view-job-button"
    type="button"
    onClick={() => navigate(`/jobs/${job.id}`)}
  >
    View Details →
  </button>

  {isJobSeeker && (
    appliedJobIds.includes(Number(job.id)) ? (
      <button
        className="apply-job-button applied-job-button"
        type="button"
        disabled
      >
        ✓ Applied
      </button>
    ) : (
      <button
        className="apply-job-button"
        type="button"
        onClick={() => {
          if (!token) {
            navigate('/login')
            return
          }

          setApplyingJobId(
            applyingJobId === job.id ? null : job.id
          )
          setCoverLetter('')
          setMessage('')
        }}
      >
        {applyingJobId === job.id
          ? 'Cancel Application'
          : 'Apply Now →'}
      </button>
    )
  )}

  {isJobSeeker && (
    savedJob ? (
      <button
        className="save-job-button saved"
        type="button"
        onClick={() => handleRemoveSavedJob(savedJob.id)}
        disabled={savingJobId !== null}
      >
        {savingJobId === savedJob.id
          ? 'Removing...'
          : '♥ Saved'}
      </button>
    ) : (
      <button
        className="save-job-button"
        type="button"
        onClick={() => handleSaveJob(job.id)}
        disabled={savingJobId !== null}
      >
        {savingJobId === job.id
          ? 'Saving...'
          : '♡ Save Job'}
      </button>
    )
  )}
</div>

{applyingJobId === job.id && (
  <form
    className="job-application-form"
    onSubmit={(event) => handleApply(event, job.id)}
  >
    <h4>Apply for {job.title}</h4>
    <label htmlFor={`resume-${job.id}`}>
      Select Resume (PDF)
    </label>

    <select
      id={`resume-${job.id}`}
      value={selectedResumeId}
      onChange={(event) => setSelectedResumeId(event.target.value)}
      required
      disabled={loadingResumes || resumes.length === 0}
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
      <p>
        Please upload your resume first using Resume Tools.
      </p>
    )}

    <label htmlFor={`cover-letter-${job.id}`}>
      Cover letter (optional)
    </label>

    <textarea
      id={`cover-letter-${job.id}`}
      rows="5"
      placeholder="Introduce yourself and explain why you are suitable for this role..."
      value={coverLetter}
      onChange={(event) => setCoverLetter(event.target.value)}
    />

    <button
      type="submit"
      className="apply-job-button"
      disabled={submittingApplication}
    >
      {submittingApplication
        ? 'Submitting...'
        : 'Submit Application'}
    </button>
  </form>
)}
             
             
            </article>
          )
        })}
      </div>
    </div>
  )
}

export default Jobs
