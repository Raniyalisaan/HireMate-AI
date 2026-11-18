
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

function ProtectedRoutes({ allowedRoles }) {
  const token = localStorage.getItem('accessToken')
  const role = localStorage.getItem('role')
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  try {
    const decoded = jwtDecode(token)
    const currentTime = Date.now() / 1000

    if (!decoded.exp || decoded.exp <= currentTime) {
      const refreshToken = localStorage.getItem('refreshToken')

      if (!refreshToken) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('username')
        localStorage.removeItem('role')
        localStorage.removeItem('profilePhoto')

        return <Navigate to="/login" replace />
      }
    }
  } catch {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    localStorage.removeItem('profilePhoto')

    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default ProtectedRoutes
