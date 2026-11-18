
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import ProtectedRoutes from './components/ProtectedRoutes.jsx'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import ResumeUpload from './pages/ResumeUpload'
import Jobs from './pages/Jobs'
import JobDetails from './pages/JobDetails'
import Applications from './pages/Applications'
import SavedJobs from './pages/SavedJobs'
import PostJob from './pages/PostJob'
import MyPostedJobs from './pages/MyPostedJobs'
import ReceivedApplications from './pages/ReceivedApplications'
import AIJobMatching from './pages/AIJobMatching'
import MockInterview from './pages/MockInterview'

import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uid/:token/" element={<ResetPassword />} />

        {/* All authenticated users */}
        <Route element={<ProtectedRoutes />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Job seeker only */}
        <Route element={<ProtectedRoutes allowedRoles={['job_seeker']} />}>
          <Route path="/resume-upload" element={<ResumeUpload />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/saved-jobs" element={<SavedJobs />} />
          <Route path="/ai-job-matching" element={<AIJobMatching />} />
          <Route path="/mock-interview" element={<MockInterview />} />
          
        </Route>

        {/* Recruiter only */}
        <Route element={<ProtectedRoutes allowedRoles={['recruiter']} />}>
          <Route path="/post-job" element={<PostJob />} />
          <Route path="/my-posted-jobs" element={<MyPostedJobs />} />
          <Route path="/received-applications" element={<ReceivedApplications />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
