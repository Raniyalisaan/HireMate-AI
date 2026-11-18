import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './Dashboard.css'
import { Link } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()

  
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const username = localStorage.getItem('username') || 'Job Seeker'
  const [resumeCount, setResumeCount] = useState(null)
  
const role = localStorage.getItem('role') || 'job_seeker'
const isRecruiter = role === 'recruiter'
const [applicationCount, setApplicationCount] = useState(null)
const [receivedApplications, setReceivedApplications] = useState([])
const [selectedApplication, setSelectedApplication] = useState(null)

const [savedJobCount, setSavedJobCount] = useState(null)
const [postedJobCount, setPostedJobCount] = useState(null)
const [postedJobs, setPostedJobs] = useState([])
const getApplicantsCount = (jobId) => {
  return receivedApplications.filter((application) =>
    String(
      application.job_id ??
      application.job?.id ??
      application.job
    ) === String(jobId)
  ).length
}

const [profile, setProfile] = useState({
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
  profile_photo: null,
})

const commonFields = [
  profile.phone,
  profile.location,
  profile.bio,
  profile.profile_photo,
]

const roleFields = isRecruiter
  ? [
      profile.company_name,
      profile.company_website,
      profile.designation,
    ]
  : [
      profile.skills,
      profile.education,
      profile.experience,
      profile.portfolio_url,
    ]

const profileFields = [...commonFields, ...roleFields]

const completedFields = profileFields.filter((field) => {
  if (typeof field === 'string') {
    return field.trim() !== ''
  }

  return Boolean(field)
}).length

const profileCompletion = Math.round(
  (completedFields / profileFields.length) * 100
)



useEffect(() => {
  const fetchResumeCount = async () => {
    const token = localStorage.getItem('accessToken')

    if (!token) {
      setResumeCount(null)
      return
    }

    try {
      const response = await api.get('resumes/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = response.data

      if (Array.isArray(data)) {
        setResumeCount(data.length)
      } else if (Array.isArray(data.results)) {
        setResumeCount(data.count ?? data.results.length)
      } else {
        setResumeCount(0)
      }
    } catch (error) {
      console.error(
        'Failed to fetch resume count:',
        error.response?.data || error
      )
      setResumeCount(null)
    }
  }

  fetchResumeCount()
}, [])


useEffect(() => {
  const fetchProfile = async () => {
    const token = localStorage.getItem('accessToken')

    if (!token) return

    try {
      const response = await api.get('accounts/profile/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

     
setProfile({
  phone: response.data.phone || '',
  location: response.data.location || '',
  bio: response.data.bio || '',
  skills: response.data.skills || '',
  education: response.data.education || '',
  experience: response.data.experience || '',
  portfolio_url: response.data.portfolio_url || '',
  company_name: response.data.company_name || '',
  company_website: response.data.company_website || '',
  designation: response.data.designation || '',
  profile_photo: response.data.profile_photo || null,
})

    } catch (error) {
      console.error(
        'Failed to fetch profile:',
        error.response?.data || error
      )
    }
  }

  fetchProfile()
}, [])


useEffect(() => {
  const fetchDashboardCounts = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    try {
      const applicationsResponse = await api.get('applications/')
      const applicationsData = applicationsResponse.data

      const applications = Array.isArray(applicationsData)
        ? applicationsData
        : Array.isArray(applicationsData.results)
          ? applicationsData.results
          : []

      setApplicationCount(applications.length)

      if (isRecruiter) {
        setReceivedApplications(applications)
        setSavedJobCount(0)
      } else {
        try {
          const savedJobsResponse = await api.get('jobs/saved/')
          const savedJobsData = savedJobsResponse.data

          setSavedJobCount(
            Array.isArray(savedJobsData)
              ? savedJobsData.length
              : Array.isArray(savedJobsData.results)
                ? savedJobsData.count ?? savedJobsData.results.length
                : 0
          )
        } catch (error) {
          console.error('Failed to fetch saved jobs:', error.response?.data || error)
        }
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error.response?.data || error)
    }
  }

  fetchDashboardCounts()
}, [isRecruiter])



useEffect(() => {
  if (!isRecruiter) return

  const fetchRecruiterJobs = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const response = await api.get('jobs/', {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = response.data
      const jobs = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
          ? data.results
          : []

      const payload = JSON.parse(atob(token.split('.')[1]))
      const userId = payload.user_id

      const myJobs = jobs.filter(
        (job) =>
          String(job.recruiter) === String(userId) ||
          String(job.recruiter_id) === String(userId)
      )

      setPostedJobCount(myJobs.length)
      setPostedJobs(myJobs)

    } catch (error) {
      console.error('Failed to fetch recruiter jobs:', error)
    }
  }

  fetchRecruiterJobs()
}, [isRecruiter])


  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('username')

    setShowLogoutModal(false)
    navigate('/')
  }
 
  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar">

        <Link to="/" className="dashboard-logo">
            HireMate<span> AI</span>
            </Link>

       {isRecruiter ? (
  <>
    <Link to="/dashboard">📊 Overview</Link>
    <Link to="/my-posted-jobs">💼 My Posted Jobs</Link>
    <Link to="/post-job">➕ Post a Job</Link>
    <Link to="/received-applications">
      📨 Received Applications
    </Link>
    <Link to="/profile">🏢 Company Profile</Link>
  </>
) : (
  <>
    <Link to="/dashboard">📊 Overview</Link>
    <Link to="/jobs">🔎 Find Jobs</Link>
    <Link to="/saved-jobs">⭐ Saved Jobs</Link>
    <Link to="/applications">📨 My Applications</Link>
    <Link to="/profile">👤 My Profile</Link>
    <Link to="/resume-upload">📄 Resume Tools</Link>
    <Link to="/ai-job-matching">🤖 AI Job Matching</Link>
    <Link to="/mock-interview">🎤 Mock Interview</Link>
  </>
)}
        <button
            type="button"
            className="dashboard-logout"
            onClick={() => setShowLogoutModal(true)}
            >
            ↪ Logout
            </button>
      </aside>

      <main className="dashboard-main" id="overview">
        <header className="dashboard-header">
          <div>
           

            <p className="dashboard-eyebrow">
              {isRecruiter ? 'RECRUITER WORKSPACE' : 'JOB SEEKER WORKSPACE'}
            </p>
            <h1>Welcome back, {username}!</h1>
            <p>Let’s take the next step in your career.</p>
          </div>

          
<div className="dashboard-avatar">
  {profile.profile_photo ? (
    <img
      src={
        profile.profile_photo.startsWith('http')
          ? profile.profile_photo
          : `http://127.0.0.1:8000${
              profile.profile_photo.startsWith('/') ? '' : '/'
            }${profile.profile_photo}`
      }
      alt="Profile"
      className="dashboard-profile-photo"
    />
  ) : (
    username.charAt(0).toUpperCase()
  )}
</div>
        </header>

       
<section className="dashboard-banner">
  <div>
    <p className="dashboard-eyebrow">
      {isRecruiter ? 'RECRUITER WORKSPACE' : 'YOUR NEXT OPPORTUNITY'}
    </p>

    <h2>
      {isRecruiter
        ? 'Find the right talent for your team.'
        : 'Your dream job starts here.'}
    </h2>

    <p>
      {isRecruiter
        ? 'Post opportunities and connect with qualified candidates.'
        : 'Explore opportunities and build your career with HireMate AI.'}
    </p>

    <button
      type="button"
      onClick={() => navigate(isRecruiter ? '/post-job' : '/jobs')}
    >
      {isRecruiter ? 'Post a Job →' : 'Explore Jobs →'}
    </button>
  </div>

  <div className="banner-icon">🚀</div>
</section>


        
<section className="dashboard-stats">
  {isRecruiter ? (
    <>
      <article
  className="stat-card clickable-card"
  onClick={() => navigate('/my-posted-jobs')}
  role="button"
  tabIndex={0}
>
  <span>💼</span>
  <p>My Posted Jobs</p>
        <h2>{postedJobCount ?? '—'}</h2>
        <small>Jobs posted by your account</small>
      </article>

      <article
  className="stat-card clickable-card"
  onClick={() => navigate('/received-applications')}
  role="button"
  tabIndex={0}
>
  <span>📨</span>
  <p>Received Applications</p>
        <h2>{applicationCount ?? '—'}</h2>
        <small>Applications for your jobs</small>
      </article>

     <article
  className="stat-card clickable-card"
  onClick={() => navigate('/profile')}
  role="button"
  tabIndex={0}
>
  <span>🏢</span>
  <p>Company Profile</p>
        <h2>{profileCompletion}%</h2>
        <small>Complete your company details</small>
      </article>
    </>
  ) : (
    <>
      
<article
  className="stat-card clickable-card"
  onClick={() => navigate('/applications')}
  role="button"
  tabIndex={0}
  onKeyDown={(event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      navigate('/applications')
    }
  }}
>
  <span>📨</span>
  <p>Total Applications</p>
  <h2>{applicationCount ?? '—'}</h2>
  <small>Track your job applications →</small>
</article>


      
<article
  className="stat-card clickable-card"
  onClick={() => navigate('/saved-jobs')}
  role="button"
  tabIndex={0}
  onKeyDown={(event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      navigate('/saved-jobs')
    }
  }}
>
  <span>⭐</span>
  <p>Saved Jobs</p>
  <h2>{savedJobCount ?? '—'}</h2>
  <small>Jobs you want to revisit →</small>
</article>


      <article
        className="stat-card clickable-card"
        onClick={() => navigate('/resume-upload')}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            navigate('/resume-upload')
          }
        }}
      >
        <span>📄</span>
        <p>My Resumes</p>
        <h2>{resumeCount ?? '—'}</h2>
        <small>View your uploaded resumes →</small>
      </article>
    </>
  )}
</section>


<section className="dashboard-bottom">
  {isRecruiter ? (
    <>
      <div className="dashboard-panel">
        <h2>Recruiter Quick Actions</h2>
        <p className="panel-description">
          Manage your job postings and connect with candidates.
        </p>

        <div className="empty-state">
          <span>💼</span>
          <h3>Build your team with HireMate AI</h3>
          <p>
            Post a job, review applications, and find the right
            candidates for your company.
          </p>

          <button
            type="button"
            onClick={() => navigate('/post-job')}
          >
            Post a Job →
          </button>

          <button
            type="button"
            onClick={() => navigate('/my-posted-jobs')}
          >
            View My Posted Jobs →
          </button>

          <button
            type="button"
            onClick={() => navigate('/received-applications')}
          >
            Review Applications →
          </button>
        </div>
      </div>

      <div className="dashboard-panel">
        <h2>Company Profile</h2>
        <p className="panel-description">
          Keep your company details updated to build trust with candidates.
        </p>

        <div className="profile-progress">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>

          <p>{profileCompletion}% Profile completion</p>
        </div>

        <ul className="profile-checklist">
          <li>
            {profile.phone.trim() && profile.location.trim() ? '✓' : '○'}
            {' '}Add contact details
          </li>
          <li>
            {profile.company_name.trim() ? '✓' : '○'}
            {' '}Add company name
          </li>
          <li>
            {profile.designation.trim() ? '✓' : '○'}
            {' '}Add designation
          </li>
          <li>
            {profile.company_website.trim() ? '✓' : '○'}
            {' '}Add company website
          </li>
        </ul>

        <button
          type="button"
          className="secondary-dashboard-button"
          onClick={() => navigate('/profile')}
        >
          Edit Company Profile →
        </button>
      </div>
    </>
  ) : (
    <>
      <div className="dashboard-panel" id="jobs">
        <h2>Recommended for You</h2>
        <p className="panel-description">
          Discover opportunities that match your skills and career goals.
        </p>

        <div className="empty-state">
          <span>💼</span>
          <h3>Discover your next opportunity</h3>
          <p>
            Explore available jobs and find a role that matches your skills.
          </p>

          <button
            type="button"
            onClick={() => navigate('/jobs')}
          >
            Browse Jobs →
          </button>
        </div>
      </div>

      <div className="dashboard-panel" id="profile">
        <h2>Complete Your Profile</h2>
        <p className="panel-description">
          Make it easier for recruiters to discover you.
        </p>

        <div className="profile-progress">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>

          <p>{profileCompletion}% Profile completion</p>
        </div>

        <ul className="profile-checklist">
          <li>
            {profile.phone.trim() && profile.location.trim() ? '✓' : '○'}
            {' '}Add your contact details
          </li>
          <li>
            {profile.skills.trim() ? '✓' : '○'}
            {' '}Add your skills
          </li>
          <li>
            {profile.education.trim() ? '✓' : '○'}
            {' '}Add your education
          </li>
          <li>
            {profile.experience.trim() ? '✓' : '○'}
            {' '}Add your experience
          </li>
          <li>
            {resumeCount > 0 ? '✓' : '○'}
            {' '}Upload your resume
          </li>
        </ul>

        <button
          type="button"
          className="secondary-dashboard-button"
          onClick={() => navigate('/profile')}
        >
          Complete Profile →
        </button>
      </div>
    </>
  )}
</section>

        
      </main>

       {/* Logout Confirmation Modal  */}
      {showLogoutModal && (
  <div className="logout-modal-overlay">
    <div className="logout-modal">
      <h2>Confirm Logout</h2>
      <p>Are you sure you want to logout from HireMate AI?</p>

      <div className="logout-modal-actions">
        <button
          type="button"
          className="cancel-logout-btn"
          onClick={() => setShowLogoutModal(false)}
        >
          Cancel
        </button>

        <button
          type="button"
          className="confirm-logout-btn"
          onClick={handleLogout}
        >
          Yes, Logout
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  )
}

export default Dashboard
