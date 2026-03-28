import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthGuard from './components/AuthGuard';

import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import Dashboard from './pages/Dashboard';
import Referrals from './pages/Referrals';
import FraudWatch from './pages/FraudWatch';
import Rewards from './pages/Rewards';
import Logs from './pages/Logs';
import CreateUser from './pages/CreateUser';
import Users from './pages/Users';

function AppRoutes() {
  const { isAuthenticated, role } = useAuth();

  return (
    <div className="min-h-screen bg-[#111317] text-[#e2e2e8]">
      {isAuthenticated && <TopBar />}
      {isAuthenticated && <Sidebar />}
      <main className={isAuthenticated ? "pl-64 pt-20 pr-8 pb-8 min-h-screen" : "min-h-screen flex items-center justify-center p-8"}>
        <div className="w-full max-w-[1600px] mx-auto">
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Multi-Tenant Root */}
            <Route path="/" element={
              <AuthGuard>
                {role === 'admin' ? <Dashboard /> : <UserDashboard />}
              </AuthGuard>
            } />
            
            {/* Admin Restrict */}
            <Route path="/referrals" element={<AuthGuard requiredRole="admin"><Referrals /></AuthGuard>} />
            <Route path="/fraud-watch" element={<AuthGuard requiredRole="admin"><FraudWatch /></AuthGuard>} />
            <Route path="/rewards" element={<AuthGuard requiredRole="admin"><Rewards /></AuthGuard>} />
            <Route path="/logs" element={<AuthGuard requiredRole="admin"><Logs /></AuthGuard>} />
            <Route path="/users" element={<AuthGuard requiredRole="admin"><Users /></AuthGuard>} />
            <Route path="/create-user" element={<AuthGuard requiredRole="admin"><CreateUser /></AuthGuard>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
