
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './MockInterview.css'

function MockInterview() {
  const navigate = useNavigate()

  const [jobRole, setJobRole] = useState('Python Developer')
  const [experienceLevel, setExperienceLevel] = useState('Beginner')
  const [interviewType, setInterviewType] = useState('technical')

  const [session, setSession] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [report, setReport] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const startInterview = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('interviews/start/', {
        job_role: jobRole,
        experience_level: experienceLevel,
        interview_type: interviewType,
      })

      setSession(response.data)
      setCurrentIndex(0)
      setAnswer('')
      setFeedback(null)
      setReport(null)
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Could not start the interview . Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const questions = session?.questions || []
  const currentQuestion = questions[currentIndex]

  const submitAnswer = async (event) => {
    event.preventDefault()

    if (!answer.trim() || !currentQuestion) {
      setError('Please enter your answer.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.post(
        `interviews/${session.id}/questions/${currentQuestion.id}/answer/`,
        { answer: answer.trim() }
      )

      setFeedback(response.data)
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Answer submit cheyyan kazhinjilla. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const nextQuestion = () => {
    setCurrentIndex((previous) => previous + 1)
    setAnswer('')
    setFeedback(null)
    setError('')
  }

  const completeInterview = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.post(
        `interviews/${session.id}/complete/`
      )
      setReport(response.data)
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Interview complete cheyyan kazhinjilla. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const restartInterview = () => {
    setSession(null)
    setCurrentIndex(0)
    setAnswer('')
    setFeedback(null)
    setReport(null)
    setError('')
  }

  return (
    <div className="mock-interview-page">
      <header className="mock-interview-header">
        <button
          type="button"
          className="mock-back-button"
          onClick={() => navigate('/')}
        >
          ← Home
        </button>
        <h2>HireMate AI</h2>
        <span>Mock Interview</span>
      </header>

      <main className="mock-interview-container">
        {!session && (
          <section className="mock-interview-card">
            <div className="mock-icon">🎯</div>
            <h1>AI Mock Interview</h1>
            <p>
              Practice interview questions and receive AI-powered
              feedback on your answers.
            </p>

            <form onSubmit={startInterview}>
              <label htmlFor="jobRole">Job Role</label>
              <input
                id="jobRole"
                value={jobRole}
                onChange={(event) => setJobRole(event.target.value)}
                placeholder="e.g. Python Developer"
                required
              />

              <label htmlFor="experienceLevel">Experience Level</label>
              <select
                id="experienceLevel"
                value={experienceLevel}
                onChange={(event) => setExperienceLevel(event.target.value)}
              >
                <option value="Beginner">Beginner</option>
                <option value="Junior">Junior</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Experienced">Experienced</option>
              </select>

              <label htmlFor="interviewType">Interview Type</label>
              <select
                id="interviewType"
                value={interviewType}
                onChange={(event) => setInterviewType(event.target.value)}
              >
                <option value="technical">Technical Interview</option>
                <option value="hr">HR Interview</option>
                <option value="behavioral">Behavioral Interview</option>
              </select>

              {error && <p className="mock-error">{error}</p>}

              <button
                type="submit"
                className="mock-primary-button"
                disabled={loading}
              >
                {loading ? 'Generating Questions...' : 'Start Interview'}
              </button>
            </form>
          </section>
        )}

        {session && !report && currentQuestion && (
          <section className="mock-interview-card mock-question-card">
            <div className="mock-progress">
              Question {currentIndex + 1} of {questions.length}
            </div>

            <div className="mock-progress-track">
              <div
                className="mock-progress-fill"
                style={{
                  width: `${((currentIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>

            <h1>{session.job_role} Interview</h1>
            <h3>{currentQuestion.question_text}</h3>

            {!feedback ? (
              <form onSubmit={submitAnswer}>
                <label htmlFor="interviewAnswer">Your Answer</label>
                <textarea
                  id="interviewAnswer"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Type your answer here..."
                  rows={7}
                  required
                />

                {error && <p className="mock-error">{error}</p>}

                <button
                  type="submit"
                  className="mock-primary-button"
                  disabled={loading}
                >
                  {loading ? 'Evaluating Answer...' : 'Submit Answer'}
                </button>
              </form>
            ) : (
              <div className="mock-feedback">
                <h3>AI Feedback</h3>
                <p className="mock-score">
                  Score: {feedback.score}/10
                </p>
                <p>{feedback.feedback}</p>

                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    className="mock-primary-button"
                    onClick={nextQuestion}
                  >
                    Next Question →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="mock-primary-button"
                    onClick={completeInterview}
                    disabled={loading}
                  >
                    {loading ? 'Preparing Report...' : 'Complete Interview'}
                  </button>
                )}

                {error && <p className="mock-error">{error}</p>}
              </div>
            )}
          </section>
        )}

        {report && (
          <section className="mock-interview-card mock-report-card">
            <div className="mock-icon">🏆</div>
            <h1>Interview Completed!</h1>
            <p>{report.job_role}</p>

            <div className="mock-result-score">
              <strong>{report.percentage}%</strong>
              <span>
                {report.total_score} / {report.maximum_score} points
              </span>
            </div>
            <div className="mock-performance-summary">
  <h3>
    {report.percentage >= 80
      ? 'Excellent Performance!'
      : report.percentage >= 60
        ? 'Good Progress!'
        : 'Keep Practicing!'}
  </h3>

  <p>
    {report.percentage >= 80
      ? 'Great work! Your answers show strong interview readiness. Keep refining your skills.'
      : report.percentage >= 60
        ? 'You have a good foundation. Improve answer completeness and include practical examples.'
        : 'Focus on the fundamentals, practise regularly, and explain your answers with examples.'}
  </p>

  <h4>Recommended Next Steps</h4>
  <ul>
    <li>Review the feedback for each question.</li>
    <li>Practise explaining technical concepts with examples.</li>
    <li>Take another mock interview to track your progress.</li>
  </ul>
</div>

            <h3>Your Feedback Report</h3>

            {report.questions?.map((question, index) => (
              <div
                className="mock-report-question"
                key={question.question_id}
              >
                <strong>
                  {index + 1}. {question.question}
                </strong>
                <p>Score: {question.score}/10</p>
                <p>{question.feedback}</p>
              </div>
            ))}

            <button
              type="button"
              className="mock-primary-button"
              onClick={restartInterview}
            >
              Start Another Interview
            </button>
            <button
              type="button"
              className="mock-secondary-button"
              onClick={() => navigate('/')}
            >
              Back to Home
            </button>
          </section>
        )}

        {session && !report && !currentQuestion && (
          <section className="mock-interview-card">
            <p>No questions were returned by the server.</p>
            <button
              type="button"
              className="mock-primary-button"
              onClick={restartInterview}
            >
              Try Again
            </button>
          </section>
        )}
      </main>
    </div>
  )
}

export default MockInterview
