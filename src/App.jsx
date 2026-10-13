import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Splash from './pages/Splash';
import Login from './pages/Login';
import Places from './pages/Places';
import VenueDetail from './pages/VenueDetail';
import VenueMap from './pages/VenueMap';
import Profile from './pages/Profile';
import SearchMap from './pages/SearchMap';
import Editor from './pages/Editor';

// Routes that use position:fixed fullscreen — must NOT have transform on parent
// because transform creates a new containing block that traps fixed children.
const FULLSCREEN_ROUTES = ['/search', '/editor'];

function AnimatedRoutes() {
  const location = useLocation();
  const containerRef = useRef(null);
  const isFullscreen = FULLSCREEN_ROUTES.some(r => location.pathname.startsWith(r));

  useEffect(() => {
    const el = containerRef.current;
    if (!el || isFullscreen) return; // skip transform animation for fullscreen pages
    el.style.animation = 'none';
    void el.offsetHeight; // force reflow
    el.style.animation = 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both';
  }, [location.pathname, isFullscreen]);

  return (
    // For fullscreen pages: no animation wrapper (transform would trap fixed children)
    // For normal pages: animate with fadeInUp
    isFullscreen ? (
      <Routes location={location} key={location.pathname}>
        <Route path="/search"  element={<SearchMap />} />
        <Route path="/editor"  element={<Editor />} />
      </Routes>
    ) : (
      <div ref={containerRef} className="route-wrapper">
        <Routes location={location} key={location.pathname}>
          <Route path="/"              element={<Splash />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/places"        element={<Places />} />
          <Route path="/venue/:id"     element={<VenueDetail />} />
          <Route path="/venue/:id/map" element={<VenueMap />} />
          <Route path="/profile"       element={<Profile />} />
        </Routes>
      </div>
    )
  );
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <AnimatedRoutes />
      </div>
    </Router>
  );
}

export default App;
