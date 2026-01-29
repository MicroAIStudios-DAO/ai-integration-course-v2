import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getCourses } from '../../firebaseService';
import { Module } from '../../types/course';
import { useAuth } from '../../context/AuthContext'; // Adjusted path

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const hideMenuLinks = location.pathname === '/pricing' || location.pathname.startsWith('/checkout');
  const [modules, setModules] = useState<Module[]>([]);
  const [courseId, setCourseId] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login'); // Redirect to login page after logout
    } catch (error) {
      console.error("Failed to log out", error);
      // Optionally, show an error message to the user
    }
  };

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!menuOpen) return;
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  useEffect(() => {
    let isActive = true;
    if (!menuOpen || modules.length > 0) return;
    getCourses()
      .then((courses) => {
        if (!isActive) return;
        const course = courses[0];
        if (course) {
          setCourseId(course.id);
          setModules(course.modules || []);
        }
      })
      .catch((error) => {
        console.warn('Failed to load modules for nav:', error);
      });

    return () => {
      isActive = false;
    };
  }, [menuOpen, modules.length]);

  return (
    <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-blue-700 text-white p-4 shadow-md font-sans border-b border-white/10">
      <nav className="container mx-auto flex items-center justify-between">
        <NavLink to="/" className="text-xl font-headings font-extrabold hover:text-blue-200 transition-colors">
          AI Course Platform
        </NavLink>
        {!hideMenuLinks && (
          <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-md border border-white/30 px-5 py-2 text-sm font-headings font-extrabold uppercase tracking-wide hover:bg-white/10 transition-colors"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            Menu
            <span className="text-xs">▾</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md bg-white text-gray-900 shadow-lg ring-1 ring-black/10 z-50">
                <div className="py-2">
                  <NavLink
                    to="/"
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `block px-4 py-2 text-sm font-headings font-extrabold uppercase tracking-wide hover:bg-gray-100 ${isActive ? 'text-blue-700' : ''}`
                    }
                  >
                    Home
                  </NavLink>
                <NavLink
                  to="/courses"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-2 text-sm font-headings font-extrabold uppercase tracking-wide hover:bg-gray-100 ${isActive ? 'text-blue-700' : ''}`
                  }
                >
                  Courses
                </NavLink>
                <div className="relative group">
                  <span className="block px-4 py-2 text-sm font-headings font-extrabold uppercase tracking-wide hover:bg-gray-100 cursor-default">
                    Modules ▸
                  </span>
                  <div className="absolute left-full top-0 ml-2 hidden group-hover:block">
                    <div className="w-64 rounded-md bg-white text-gray-900 shadow-lg ring-1 ring-black/10">
                      {modules.length === 0 && (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          Loading modules...
                        </div>
                      )}
                      {modules.map((module) => (
                        <div key={module.id} className="relative group/module">
                          <span className="block px-4 py-2 text-sm font-headings font-extrabold uppercase tracking-wide hover:bg-gray-100">
                            {module.title}
                          </span>
                          <div className="absolute left-full top-0 ml-2 hidden group-hover/module:block">
                            <div className="w-72 rounded-md bg-white text-gray-900 shadow-lg ring-1 ring-black/10">
                              {module.lessons?.map((lesson) => (
                                <NavLink
                                  key={lesson.id}
                                  to={courseId ? `/courses/${courseId}/modules/${module.id}/lessons/${lesson.id}` : '/courses'}
                                  onClick={() => setMenuOpen(false)}
                                  className="block px-4 py-2 text-sm font-sans hover:bg-gray-100"
                                >
                                  {lesson.title}
                                </NavLink>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                  {currentUser && (
                    <NavLink
                      to="/recap"
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `block px-4 py-2 text-sm font-headings font-extrabold uppercase tracking-wide hover:bg-gray-100 ${isActive ? 'text-blue-700' : ''}`
                      }
                    >
                      Recaps
                    </NavLink>
                  )}
                  {currentUser ? (
                    <button
                      onClick={() => { setMenuOpen(false); handleLogout(); }}
                      className="block w-full text-left px-4 py-2 text-sm font-headings font-extrabold uppercase tracking-wide hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  ) : (
                    <>
                      <NavLink
                        to="/login"
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) =>
                          `block px-4 py-2 text-sm font-headings font-extrabold uppercase tracking-wide hover:bg-gray-100 ${isActive ? 'text-blue-700' : ''}`
                        }
                      >
                        Login
                      </NavLink>
                      <NavLink
                        to="/signup"
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) =>
                          `block px-4 py-2 text-sm font-headings font-extrabold uppercase tracking-wide hover:bg-gray-100 ${isActive ? 'text-blue-700' : ''}`
                        }
                      >
                        Sign Up
                      </NavLink>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 font-sans">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <Outlet />
      </main>
      <footer className="bg-slate-900 text-white p-6 font-sans">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2025 MicroAI Studios™ — All rights reserved.</p>
            <div className="flex gap-6 text-sm">
              <NavLink 
                to="/terms" 
                className="hover:text-blue-300 transition-colors underline"
                aria-label="View Terms of Use"
              >
                Terms of Use
              </NavLink>
              <NavLink 
                to="/privacy" 
                className="hover:text-blue-300 transition-colors underline"
                aria-label="View Privacy Policy"
              >
                Privacy Policy
              </NavLink>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 text-xs text-gray-400 text-center">
            <p>
              ⚠️ This platform uses AI systems for personalized tutoring and content recommendations. 
              AI-generated responses are provided for educational assistance and should be verified independently.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
