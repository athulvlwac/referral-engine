import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthGuard({ children, requiredRole }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.has('ref')) {
      return <Navigate to={`/register${location.search}`} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // If a user tries to access admin routes, kick them to their dashboard
    return <Navigate to="/" replace />;
  }

  return children;
}
