import { Link, Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import MemberPortal from './pages/MemberPortal.jsx';
import OwnerDashboard from './pages/OwnerDashboard.jsx';

function Protected({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'owner' ? '/dashboard' : '/portal'} replace />;
  return children;
}

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="site-header">
      <Link to="/" className="brand">
        IRON<span>HOUSE</span>
      </Link>
      <nav>
        <NavLink to="/">Home</NavLink>
        {user?.role === 'member' && <NavLink to="/portal">My Portal</NavLink>}
        {user?.role === 'owner' && <NavLink to="/dashboard">Dashboard</NavLink>}
      </nav>
      <div className="header-actions">
        {user ? (
          <>
            <span className="who">{user.name}</span>
            <button
              className="btn ghost"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link className="btn ghost" to="/login">
              Log in
            </Link>
            <Link className="btn" to="/register">
              Join now
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="app">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/portal"
            element={
              <Protected role="member">
                <MemberPortal />
              </Protected>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Protected role="owner">
                <OwnerDashboard />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <span>© {new Date().getFullYear()} Ironhouse Gym</span>
        <span>Mon–Sun · 5am – 11pm · 42 Foundry Street</span>
      </footer>
    </div>
  );
}
