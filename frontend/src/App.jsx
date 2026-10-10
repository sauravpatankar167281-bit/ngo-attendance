import { Routes, Route, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { getUser, logout, isStaff } from './api.js';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Activities from './pages/Activities.jsx';
import Attend from './pages/Attend.jsx';
import Feedback from './pages/Feedback.jsx';

function Protected({ children }) {
  const loc = useLocation();
  if (getUser()) return children;
  // remember the page (for example a scanned QR link) so we can return after login
  sessionStorage.setItem('after_login', loc.pathname);
  return <Navigate to="/login" replace />;
}

function Nav() {
  const user = getUser();
  const nav = useNavigate();
  if (!user) return null;
  return (
    <header className="nav">
      <b>NGO Attendance</b>
      <nav>
        {isStaff(user) && <NavLink to="/">Dashboard</NavLink>}
        <NavLink to="/activities">Activities</NavLink>
      </nav>
      <span className="who">{user.name} ({user.role})</span>
      <button className="ghost" onClick={() => { logout(); nav('/login'); }}>Logout</button>
    </header>
  );
}

export default function App() {
  const user = getUser();
  return (
    <>
      <Nav />
      <main className="wrap">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Protected>{isStaff(user) ? <Dashboard /> : <Navigate to="/activities" />}</Protected>} />
          <Route path="/activities" element={<Protected><Activities /></Protected>} />
          <Route path="/attend/:token" element={<Protected><Attend /></Protected>} />
          <Route path="/feedback/:id" element={<Protected><Feedback /></Protected>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}
