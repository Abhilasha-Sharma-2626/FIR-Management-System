import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Shield, ArrowRight, LogOut, User as UserIcon, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change or escape
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'Services', path: '/services' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-ivory/95 backdrop-blur-md border-b border-borderSoft shadow-subtle py-3'
          : 'bg-ivory/80 backdrop-blur-sm border-b border-borderSoft/60 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Mark */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded-lg p-1"
            aria-label="CaseSync Homepage"
          >
            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-saffron shadow-subtle group-hover:scale-105 transition-transform duration-200">
              <Shield className="w-4 h-4 fill-saffron/20 stroke-saffron" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-base sm:text-lg text-navy tracking-tight group-hover:text-ink transition-colors leading-tight">
                CaseSync
              </span>
              <span className="text-[9px] sm:text-[10px] tracking-wider uppercase font-semibold text-slate-muted">
                Citizen FIR & Case Portal
              </span>
            </div>
          </Link>

          {/* Desktop Multi-Page Navigation */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-medium px-3.5 py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'text-navy font-semibold bg-white border border-borderSoft shadow-subtle'
                      : 'text-slate hover:text-navy hover:bg-black/5'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Right CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 bg-white border border-borderSoft hover:border-navy/30 rounded-lg px-3 py-1.5 shadow-subtle transition-colors group"
                >
                  <div className="w-6 h-6 rounded-full bg-navy/10 text-navy flex items-center justify-center font-bold text-xs">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-ink leading-tight truncate max-w-[130px]">
                      {user?.fullName || user?.email?.split('@')[0]}
                    </p>
                    <span className="inline-block text-[9px] font-bold text-slate-muted uppercase tracking-wider">
                      {user?.role || 'CITIZEN'}
                    </span>
                  </div>
                  <LayoutDashboard className="w-3.5 h-3.5 text-slate-muted group-hover:text-navy ml-1" />
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  title="Sign out of your session"
                  className="text-slate hover:text-civicRed"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Submit a Complaint
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded-lg"
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-ivory border-b border-borderSoft px-4 pt-2 pb-5 shadow-card animate-fadeIn">
          <div className="flex flex-col space-y-1.5 pt-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `text-sm font-medium py-2 px-3 rounded-lg transition-colors ${
                    isActive
                      ? 'text-navy font-semibold bg-white border border-borderSoft shadow-subtle'
                      : 'text-slate hover:text-navy hover:bg-black/5'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            <div className="pt-3 border-t border-borderSoft flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-borderSoft"
                  >
                    <UserIcon className="w-4 h-4 text-navy" />
                    <div>
                      <p className="text-sm font-semibold text-ink">{user?.fullName || user?.email}</p>
                      <p className="text-xs text-slate-muted">{user?.role || 'CITIZEN'} &bull; View Dashboard</p>
                    </div>
                  </Link>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                      navigate('/');
                    }}
                    leftIcon={<LogOut className="w-4 h-4" />}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" size="md" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="md" className="w-full">
                      Submit a Complaint
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
