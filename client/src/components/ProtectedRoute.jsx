import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'

/** Route guard: requires a logged-in user (and optionally a role). */
export default function ProtectedRoute({ children, role }) {
  const { user, booting } = useAuth()
  const location = useLocation()

  if (booting) return <Spinner label="Checking your session…" />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}
