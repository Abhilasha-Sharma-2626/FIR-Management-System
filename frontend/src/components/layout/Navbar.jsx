import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import ComplaintModal from '../ui/ComplaintModal';
import { authApi } from '../../lib/api';

export function Navbar({ onOpenFileComplaint }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState('Theft / Property Loss');
  const [backendOnline, setBackendOnline] = useState(true);

  const { user, isAuthenticated, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Check backend health
  useEffect(() => {
    let isMounted = true;
    authApi.checkBackendHealth()
      .then(() => { if (isMounted) setBackendOnline(true); })
      .catch(() => { if (isMounted) setBackendOnline(false); });
    return () => { isMounted = false; };
  }, []);

  // Listen to custom event so any card or button across any page can open the complaint modal
  useEffect(() => {
    const handleCustomOpen = (e) => {
      if (e?.detail?.category) {
        setModalCategory(e.detail.category);
      }
      setComplaintModalOpen(true);
    };

    window.addEventListener('open-complaint-modal', handleCustomOpen);
    return () => window.removeEventListener('open-complaint-modal', handleCustomOpen);
  }, []);

  // Close mobile drawer on route transition
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleFileComplaintClick = () => {
    if (onOpenFileComplaint) {
      onOpenFileComplaint();
    } else {
      navigate('/file-complaint');
    }
  };

  return (
    <>
      {/* 1. TOP STATUTORY & EMERGENCY HELPLINE BANNER */}
      <div className="bg-primary text-surface-container-lowest text-[11px] py-1 px-6 lg:px-12 flex justify-between items-center border-b border-primary-container z-40">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center font-medium gap-1.5">
            <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`}></span>
            <span>POLICE DIGITAL LEDGER</span>
          </span>
          <span className="text-outline-variant">|</span>
          <span className="hidden sm:inline text-surface-variant/80 font-normal">BNSS (2023) &amp; IT Act Compliant</span>
        </div>
        <div className="flex items-center space-x-4">
          <a href="tel:112" className="flex items-center gap-1 text-tertiary-fixed font-semibold tracking-wider hover:underline">
            <span className="material-symbols-outlined text-[14px]">emergency</span>
            <span>EMERGENCY: 112</span>
          </a>
        </div>
      </div>

      {/* 2. STICKY MAIN NAVBAR */}
      <header className="top-0 sticky z-50 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/60 shadow-xs transition-all duration-200">
        <div className="w-full px-6 lg:px-12 py-3 flex items-center justify-between mx-auto max-w-7xl">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-lg">local_police</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-primary">CaseSync</span>
                <span className="text-[9px] font-semibold uppercase bg-surface-container text-secondary px-1.5 py-0.2 rounded border border-outline-variant">Gov.IN</span>
              </div>
              <span className="text-[10px] text-secondary tracking-wider uppercase font-medium">Police Investigation System</span>
            </div>
          </Link>

          {/* Desktop Multi-Page Navigation Routes */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs font-medium">
            <Link 
              to="/" 
              className={`transition-colors py-1 ${
                location.pathname === '/' 
                  ? 'text-primary font-bold border-b-2 border-primary' 
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/fir-journey" 
              className={`transition-colors py-1 ${
                location.pathname === '/fir-journey' || location.pathname === '/how-it-works'
                  ? 'text-primary font-bold border-b-2 border-primary' 
                  : 'text-secondary hover:text-primary'
              }`}
            >
              FIR Journey
            </Link>
            <Link 
              to="/services" 
              className={`transition-colors py-1 ${
                location.pathname === '/services' 
                  ? 'text-primary font-bold border-b-2 border-primary' 
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Services
            </Link>
            <Link 
              to="/live-tracking" 
              className={`transition-colors py-1 ${
                location.pathname === '/live-tracking' 
                  ? 'text-primary font-bold border-b-2 border-primary' 
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Track Docket
            </Link>
            <Link 
              to="/privacy-policy" 
              className={`transition-colors py-1 ${
                location.pathname === '/privacy-policy' 
                  ? 'text-primary font-bold border-b-2 border-primary' 
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Privacy Policy
            </Link>
          </nav>

          {/* Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Auth State Conditional */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link 
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-primary text-xs font-semibold hover:bg-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">badge</span>
                  <span>{user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Dashboard'}</span>
                  {role && (
                    <span className="text-[10px] font-mono uppercase bg-primary text-white px-1.5 py-0.2 rounded font-bold">
                      {role}
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  title="Sign Out"
                  className="p-1.5 text-secondary hover:text-error hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link 
                  to="/login"
                  className="px-3 py-1.5 text-xs text-primary hover:text-primary-container font-semibold transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  to="/signup"
                  className="px-3 py-1.5 text-xs text-primary bg-surface-container-lowest border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors font-semibold shadow-xs"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* File Complaint Primary CTA */}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleFileComplaintClick}
              className="inline-flex items-center px-3.5 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-container transition-colors text-xs font-semibold shadow-xs cursor-pointer gap-1.5"
            >
              <span className="material-symbols-outlined text-sm text-tertiary-fixed-dim">edit_document</span>
              <span>+ File e-FIR</span>
            </motion.button>

            {/* Mobile Hamburger */}
            <button 
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-primary hover:bg-surface-container-low rounded-lg cursor-pointer" 
              id="mobile-menu-btn"
            >
              <span className="material-symbols-outlined text-xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden px-6 py-4 bg-surface-container-lowest border-t border-outline-variant space-y-2 text-xs"
            >
              <Link onClick={() => setMobileMenuOpen(false)} className="block py-1.5 font-semibold text-primary" to="/">Home</Link>
              <Link onClick={() => setMobileMenuOpen(false)} className="block py-1.5 font-semibold text-primary" to="/fir-journey">FIR Journey</Link>
              <Link onClick={() => setMobileMenuOpen(false)} className="block py-1.5 font-semibold text-primary" to="/services">Services</Link>
              <Link onClick={() => setMobileMenuOpen(false)} className="block py-1.5 font-semibold text-primary" to="/live-tracking">Track Docket</Link>
              <Link onClick={() => setMobileMenuOpen(false)} className="block py-1.5 font-semibold text-primary" to="/privacy-policy">Privacy Policy</Link>
              
              <div className="pt-3 border-t border-outline-variant flex flex-col gap-2">
                {isAuthenticated ? (
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-center py-2 bg-primary text-white rounded-lg font-semibold text-xs">
                    Open Dashboard ({role})
                  </Link>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-center py-2 text-primary border border-outline-variant rounded-lg font-semibold text-xs">
                      Sign In
                    </Link>
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="text-center py-2 bg-surface-container text-primary rounded-lg font-semibold text-xs">
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Global Complaint Modal */}
      <ComplaintModal 
        isOpen={complaintModalOpen}
        onClose={() => setComplaintModalOpen(false)}
        initialCategory={modalCategory}
      />
    </>
  );
}

export default Navbar;
