
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../App.css'
import api from '../api'
import { jsPDF } from 'jspdf'


function Home() {
  const navigate = useNavigate()

  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

 // AI Resume Analysis states
  const [showResumePicker, setShowResumePicker] = useState(false)
  const [resumes, setResumes] = useState([])
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const [username, setUsername] = useState(
    localStorage.getItem('username') || ''
  )

  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem('accessToken'))
  )

  const [profilePhoto, setProfilePhoto] = useState('')
  const [role, setRole] = useState(
  localStorage.getItem('role') || 'job_seeker'
)

  useEffect(() => {
  const token = localStorage.getItem('accessToken')
  const savedUsername = localStorage.getItem('username')
  const savedRole = localStorage.getItem('role') || 'job_seeker'



  setIsLoggedIn(Boolean(token))
  setUsername(token ? savedUsername || '' : '')
  setRole(savedRole)
}, [])

  useEffect(() => {
  if (!localStorage.getItem('accessToken')) {
    setProfilePhoto('')
    return
  }

  api.get('accounts/profile/')
    .then((response) => {
      setProfilePhoto(response.data.profile_photo || '')
    })
    .catch((error) => {
      console.error(
        'Profile photo loading error:',
        error.response?.data || error
      )
    })
}, [isLoggedIn])
 

useEffect(() => {
  if (!showResumePicker) return

  const previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'

  return () => {
    document.body.style.overflow = previousOverflow
  }
}, [showResumePicker])


const handleLogout = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('username')
  localStorage.removeItem('role')

  setUsername('')
  setIsLoggedIn(false)
  setShowLogoutModal(false)
  navigate('/')
}

const getPhotoUrl = (photo) => {
  if (!photo) return ''

  if (photo.startsWith('http')) {
    return photo
  }

  const backendURL = import.meta.env.VITE_API_URL?.replace('/api/', '') 
    || 'http://127.0.0.1:8000'

  return `${backendURL}${photo.startsWith('/') ? '' : '/'}${photo}`
}

  
const openResumePicker = async () => {
  if (!isLoggedIn) {
    navigate('/login')
    return
  }

  if (role !== 'job_seeker') {
    setAiError('AI career tools are available for job seekers.')
    return
  }

  setShowResumePicker(true)
  setAnalysis(null)
  setAiError('')

  try {
    const response = await api.get('resumes/')
    const data = response.data

    setResumes(Array.isArray(data) ? data : data.results || [])
  } catch (error) {
    console.error('Resume loading error:', error.response?.data || error)
    setAiError('Could not load your resumes. Please try again.')
  }
}
 

const handleAnalyzeResume = async () => {
  if (!selectedResumeId) {
    setAiError('Please select a resume first.')
    return
  }

  setAiLoading(true)
  setAiError('')
  setAnalysis(null)

  try {
    const response = await api.post('resumes/analyze/', {
      resume_id: selectedResumeId,
    })

    setAnalysis(response.data.analysis)
  } catch (error) {
    console.error('AI analysis error:', error.response?.data || error)
    setAiError(
      error.response?.data?.error ||
      'AI analysis failed. Please try again.'
    )
  } finally {
    setAiLoading(false)
  }
}

const handleDownloadReport = () => {
  if (!analysis) return

  try {
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text('HireMate AI - Resume Analysis Report', 15, 20)

    let y = 35

    const addSection = (heading, content) => {
      if (y > 260) {
        doc.addPage()
        y = 20
      }

      doc.setFontSize(14)
      doc.text(heading, 15, y)
      y += 8

      doc.setFontSize(10)

      const items = Array.isArray(content)
        ? content
        : [String(content || 'Not provided')]

      items.forEach((item) => {
        const lines = doc.splitTextToSize(String(item), 175)

        if (y + lines.length * 5 > 275) {
          doc.addPage()
          y = 20
        }

        doc.text(lines, 15, y)
        y += lines.length * 5 + 2
      })

      y += 5
    }

    addSection('Resume Score', `${analysis.score ?? 0}/100`)
    addSection('Summary', analysis.summary)
    addSection('Strengths', analysis.strengths || [])
    addSection('Areas to Improve', analysis.weaknesses || [])
    addSection('Detected Skills', analysis.detected_skills || [])
    addSection('Personalized Suggestions', analysis.suggestions || [])

    doc.save('HireMate_AI_Resume_Analysis.pdf')
  } catch (error) {
    console.error('PDF download error:', error)
    setAiError('Could not generate the PDF report. Please try again.')
  }
}

  return (
    <div className="app">

<nav className="navbar">
  <button
    type="button"
    className="hamburger-button"
    aria-label="Open navigation menu"
    aria-expanded={isMenuOpen}
    onClick={() => setIsMenuOpen(!isMenuOpen)}
  >
    <span></span>
    <span></span>
    <span></span>
  </button>

  <Link
    to="/"
    className="logo"
    onClick={() => setIsMenuOpen(false)}
  >
    HireMate<span> AI</span>
  </Link>

  <div className="nav-links">
 
<a href="#home">Home</a>
<a href="#features">Features</a>

  {(!isLoggedIn || role === 'job_seeker') && (
    <Link to="/jobs">Find Jobs</Link>
  )}
</div>
  
<div className="nav-buttons">
  {isLoggedIn ? (
    <>
      <div className="home-user-info">
  <div className="home-user-avatar">
    {profilePhoto ? (
      <img
        src={getPhotoUrl(profilePhoto)}
        alt="Profile"
      />
    ) : (
      (username || 'U').charAt(0).toUpperCase()
    )}
  </div>

  <span className="welcome-user">
    Welcome, {username}!
  </span>
</div>

      <button
        type="button"
        className="login-btn"
        onClick={() => setShowLogoutModal(true)}
      >
        Logout
      </button>
    </>
  ) : (

      <>
        <Link className="login-btn" to="/login">
          Login
        </Link>
        <Link className="signup-btn" to="/register">
          Get Started
        </Link>
      </>
    )}
  </div>
</nav>

{isMenuOpen && (
  <div className="menu-backdrop">
    <aside className="account-sidebar">
      <div className="sidebar-heading">
        <div>
          <h2>HireMate AI</h2>
          <p>{username || 'Welcome to HireMate AI'}</p>
        </div>

        <button
          type="button"
          className="sidebar-close"
          onClick={() => setIsMenuOpen(false)}
        >
          ×
        </button>
      </div>

      <nav className="account-menu">
  <Link
    to="/dashboard"
    onClick={() => setIsMenuOpen(false)}
  >
    <span>📊</span> Dashboard
  </Link>

  {role === 'recruiter' ? (
    <>
      <Link
        to="/my-posted-jobs"
        onClick={() => setIsMenuOpen(false)}
      >
        <span>💼</span> My Posted Jobs
      </Link>

      <Link
        to="/post-job"
        onClick={() => setIsMenuOpen(false)}
      >
        <span>➕</span> Post a Job
      </Link>

      <Link
        to="/received-applications"
        onClick={() => setIsMenuOpen(false)}
      >
        <span>📨</span> Received Applications
      </Link>

      <Link
        to="/profile"
        onClick={() => setIsMenuOpen(false)}
      >
        <span>🏢</span> Company Profile
      </Link>
    </>
  ) : (
    <>
      <Link to="/jobs" onClick={() => setIsMenuOpen(false)}>
        <span>🔎</span> Find Jobs
      </Link>

      <Link to="/saved-jobs" onClick={() => setIsMenuOpen(false)}>
        <span>⭐</span> Saved Jobs
      </Link>

      <Link to="/applications" onClick={() => setIsMenuOpen(false)}>
        <span>📨</span> My Applications
      </Link>

      <Link
        to="/profile"
        onClick={() => setIsMenuOpen(false)}
      >
        <span>👤</span> My Profile
      </Link>

      <Link
        to="/resume-upload"
        onClick={() => setIsMenuOpen(false)}
      >
        <span>📄</span> My Resumes
      </Link>
    </>
  )}

  {isLoggedIn ? (
    <button
      type="button"
      className="sidebar-logout"
      onClick={() => {
        setIsMenuOpen(false)
        setShowLogoutModal(true)
      }}
    >
      <span>↪</span> Logout
    </button>
  ) : (
    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
      <span>🔐</span> Login
    </Link>
  )}
</nav>
    </aside>

    <button
      type="button"
      className="menu-dismiss"
      aria-label="Close navigation menu"
      onClick={() => setIsMenuOpen(false)}
    />
  </div>
)}



      

<section className="hero" id="home">
  <div className="hero-content">
    <span className="tag">AI-POWERED RECRUITMENT PLATFORM</span>

    {role === 'recruiter' ? (
      <>
        <h1>
          Hire smarter.<br />
          Build your <span className="hero-highlight">dream team.</span>
        </h1>
        <p>
          Find skilled candidates, manage job openings, and simplify
          your recruitment process with HireMate AI.
        </p>
        <div className="hero-buttons">
          <Link to="/post-job" className="signup-btn">
            Post a Job <span>→</span>
          </Link>
          <Link to="/received-applications" className="outline-btn">
            View Applications
          </Link>
        </div>
      </>
    ) : (
      <>
        <h1>
          Your next big opportunity
          <span className="hero-highlight"> starts here.</span>
        </h1>
        <p>
          Discover jobs that fit your skills, improve your resume
          with AI-powered feedback, and take the next step in your career.
        </p>
        <div className="hero-buttons">
          <Link to="/jobs" className="signup-btn">
            Explore Jobs <span>→</span>
          </Link>
          <button
            type="button"
            className="outline-btn"
            onClick={openResumePicker}
          >
            Improve My Resume
          </button>
        </div>
      </>
    )}

    <div className="hero-trust">
      <div className="trust-item">
        <span className="trust-icon">✦</span>
        <div>
          <strong>AI-powered tools</strong>
          <p>Smarter career decisions</p>
        </div>
      </div>
      <div className="trust-item">
        <span className="trust-icon">✓</span>
        <div>
          <strong>Career focused</strong>
          <p>Built for your next step</p>
        </div>
      </div>
    </div>
  </div>

  <div className="hero-card">
    <div className="card-icon">✦</div>

    <p className="card-label">
      {role === 'recruiter'
        ? 'YOUR AI RECRUITMENT ASSISTANT'
        : 'YOUR AI CAREER ASSISTANT'}
    </p>

    <h2>
      {role === 'recruiter'
        ? 'Great talent starts with the right tools.'
        : 'Make your next career move count.'}
    </h2>

    <p className="card-description">
      {role === 'recruiter'
        ? 'Everything you need to connect with potential candidates and manage applications.'
        : 'Your personal toolkit for finding opportunities and presenting your best self.'}
    </p>

    {role === 'recruiter' ? (
      <>
        <Link to="/post-job" className="match-card">
          <div className="match-icon">💼</div>
          <div>
            <strong>Post a Job</strong>
            <p>Reach suitable candidates</p>
          </div>
          <span className="match-badge">Recruit</span>
        </Link>

        <Link to="/received-applications" className="match-card">
          <div className="match-icon">👥</div>
          <div>
            <strong>Received Applications</strong>
            <p>Review your applicants</p>
          </div>
          <span className="match-badge">Review</span>
        </Link>
      </>
    ) : (
      <>
        <button
          type="button"
          className="match-card"
          onClick={() => {
            if (!isLoggedIn) {
              navigate('/login')
            } else {
              navigate('/ai-job-matching')
            }
          }}
        >
          <div className="match-icon">🎯</div>
          <div>
            <strong>Smart Job Matching</strong>
            <p>Explore jobs that match your skills</p>
          </div>
          <span className="match-badge">AI Match</span>
        </button>

        <button
          type="button"
          className="match-card"
          onClick={openResumePicker}
        >
          <div className="match-icon">📄</div>
          <div>
            <strong>Resume Improvement</strong>
            <p>Get personalized resume insights</p>
          </div>
          <span className="match-badge">AI Tips</span>
        </button>
      </>
    )}

    <div className="hero-card-note">
      <span>✦</span>
      A smarter way to move forward.
    </div>
  </div>
</section>


      
      <section className="features" id="features">
  <p className="section-label">
    {role === 'recruiter' ? 'RECRUITMENT TOOLS' : 'EVERYTHING YOU NEED'}
  </p>

  <h2>
    {role === 'recruiter'
      ? 'Build your dream team with ease.'
      : 'Your next opportunity starts here.'}
  </h2>

  <p className="section-description">
    {role === 'recruiter'
      ? 'Simple tools to manage your hiring process.'
      : 'Smart tools to help you move forward in your career.'}
  </p>

  <div className="feature-grid">
    {role === 'recruiter' ? (
      <>
        <button
          type="button"
          className="feature-card"
          onClick={() => navigate('/post-job')}
        >
          <span>💼</span>
          <h3>Post a Job</h3>
          <p>Publish job openings and connect with suitable candidates.</p>
          <span className="feature-link">Post a job →</span>
        </button>

        <button
          type="button"
          className="feature-card"
          onClick={() => navigate('/my-posted-jobs')}
        >
          <span>📋</span>
          <h3>Manage Jobs</h3>
          <p>View, update, and manage your posted job opportunities.</p>
          <span className="feature-link">Manage jobs →</span>
        </button>

        <button
          type="button"
          className="feature-card"
          onClick={() => navigate('/received-applications')}
        >
          <span>👥</span>
          <h3>Review Applications</h3>
          <p>Review candidates and manage received applications.</p>
          <span className="feature-link">View applications →</span>
        </button>
      </>
    ) : (
      <>
        <button
          type="button"
          className="feature-card"
          onClick={() => {
            if (!isLoggedIn) {
              navigate('/login')
            } else {
              navigate('/ai-job-matching')
            }
          }}
        >
          <span>🎯</span>
          <h3>Smart Job Matching</h3>
          <p>Discover relevant jobs based on your skills and career goals.</p>
          <span className="feature-link">Explore matching jobs →</span>
        </button>

        <button
          type="button"
          className="feature-card"
          onClick={openResumePicker}
        >
          <span>📄</span>
          <h3>AI Resume Analysis</h3>
          <p>Improve your resume with actionable feedback and suggestions.</p>
          <span className="feature-link">Analyze my resume →</span>
        </button>

        <button
          type="button"
          className="feature-card"
          onClick={() => {
            if (!isLoggedIn) {
              navigate('/login')
            } else {
              navigate('/mock-interview')
            }
          }}
        >
          <span>🎤</span>
          <h3>Mock Interviews</h3>
          <p>Practice interview questions and build your confidence.</p>
          <span className="feature-link">Start interview practice →</span>
        </button>
      </>
    )}
  </div>
</section>
      
     
      
        <section className="how-it-works">
          <div className="how-heading">
            <span className="section-label">
              {role === 'recruiter'
                ? 'SIMPLIFY YOUR HIRING'
                : 'YOUR CAREER JOURNEY'}
            </span>

            <h2>
              {role === 'recruiter'
                ? 'Find the right talent in three steps.'
                : 'Turn your career goals into action.'}
            </h2>

            <p>
              {role === 'recruiter'
                ? 'Manage your recruitment process with simple, organized tools.'
                : 'Build your profile, discover opportunities, and take the next step.'}
            </p>
          </div>

          <div className="steps-grid">
            
{role === 'recruiter' ? (
  <>
    <Link
      to="/profile"
      className="step-card"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="step-number">01</div>
      <div className="step-icon">🏢</div>
      <h3>Set Up Your Profile</h3>
      <p>
        Add your company details and create a professional recruiter profile.
      </p>
    </Link>

    <Link
      to="/post-job"
      className="step-card"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="step-number">02</div>
      <div className="step-icon">💼</div>
      <h3>Post Job Openings</h3>
      <p>
        Publish job opportunities with role details, skills, and requirements.
      </p>
    </Link>

    <Link
      to="/received-applications"
      className="step-card"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="step-number">03</div>
      <div className="step-icon">👥</div>
      <h3>Review Candidates</h3>
      <p>
        Review candidates and manage received applications from your dashboard.
      </p>
    </Link>
  </>
) : (

              <>
                <Link to="/profile" className="step-card"
  style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="step-number">01</div>
                  <div className="step-icon">👤</div>
                  <h3>Build Your Profile</h3>
                  <p>
                    Showcase your skills, education, experience, and career interests.
                  </p>
                </Link>

                  <Link
                      to="/jobs"
                      className="step-card"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                  <div className="step-number">02</div>
                  <div className="step-icon">🎯</div>
                  <h3>Discover Opportunities</h3>
                  <p>
                    Explore jobs and use resume analysis and skill-based job matching tools.
                  </p>
                </Link>

                <Link
                    to="/applications"
                    className="step-card"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                  <div className="step-number">03</div>
                  <div className="step-icon">🚀</div>
                  <h3>Apply & Track</h3>
                  <p>
                    Apply for suitable jobs and follow your application progress.
                  </p>
                </Link>
              </>
            )}
          </div>

          <div className="journey-cta">
            <div>
              <h3>
                {role === 'recruiter'
                  ? 'Ready to find your next great hire?'
                  : 'Ready for your next career move?'}
              </h3>

              <p>
                {role === 'recruiter'
                  ? 'Start managing your hiring process with HireMate AI.'
                  : 'Explore opportunities and make your skills stand out.'}
              </p>
            </div>

            {isLoggedIn ? (
              <Link to="/dashboard" className="signup-btn">
                Go to Dashboard →
              </Link>
            ) : (
              <Link to="/register" className="signup-btn">
                Get Started →
              </Link>
            )}
          </div>
        </section>


      <footer>
        <h2 className="logo">
          HireMate<span> AI</span>
        </h2>
        <p>Your smarter path to career success.</p>
        <p>© 2026 HireMate AI. All rights reserved.</p>
      </footer>
      

{/* AI Resume Analysis Modal */}
{showResumePicker && (
  <div
    className="resume-analysis-overlay"
    onClick={() => {
      setShowResumePicker(false)
      setAiError('')
    }}
  >
    <div
      className="resume-analysis-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <h2>AI Resume Analysis</h2>

      <p>
        Select a resume to receive personalized insights into your
        skills, strengths, and opportunities for improvement.
      </p>

      {resumes.length === 0 ? (
        <p>No resumes found. Please upload a PDF resume first.</p>
      ) : (
        <>
          <select
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(e.target.value)}
          >
            <option value="">Select your resume</option>
            {resumes.map((resume) => (
              <option key={resume.id} value={resume.id}>
                {resume.title}
              </option>
            ))}
          </select>

          
            <button
              type="button"
              className="signup-btn"
              onClick={handleAnalyzeResume}
              disabled={aiLoading}
            >
              {aiLoading ? '⏳ Analyzing your resume...' : 'Analyze with AI'}
            </button>

            {aiLoading && (
              <p className="ai-loading-message">
                Please wait while AI reviews your resume and prepares
                personalized feedback.
              </p>
            )}

        </>
      )}

      {aiError && <p role="alert">{aiError}</p>}

      {analysis && (
        <div className="ai-analysis-results">
          <div className="ai-report-header">
            <p>HIREMATE AI · RESUME REPORT</p>
            <h3>
              {analysis.score ?? 0}<span>/100</span>
            </h3>
            <h2>Resume Analysis Results</h2>
            <p>{analysis.summary || 'No summary provided.'}</p>
          </div>

          <div className="ai-report-section">
            <h4>Strengths</h4>
            <ul>
              {(analysis.strengths || []).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="ai-report-section">
            <h4>Areas to Improve</h4>
            <ul>
              {(analysis.weaknesses || []).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="ai-report-section">
            <h4>Detected Skills</h4>
            <div className="ai-skill-list">
              {(analysis.detected_skills || []).map((skill, index) => (
                <span key={index} className="ai-skill-badge">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="ai-report-section">
            <h4>Personalized Suggestions</h4>
            <ul>
              {(analysis.suggestions || []).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="ai-report-actions">
            <button
              type="button"
              className="cancel-logout-btn"
              onClick={() => {
                setShowResumePicker(false)
                setAiError('')
                setAnalysis(null)
              }}
            >
              Close
            </button>

            <button
              type="button"
              className="download-report-btn"
              onClick={handleDownloadReport}
            >
              Download Report (PDF)
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
)}

    {/* Logout Confirmation Modal  */}
      {showLogoutModal && (
  <div className="ai-modal-overlay">
  <div className="ai-modal">
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

export default Home