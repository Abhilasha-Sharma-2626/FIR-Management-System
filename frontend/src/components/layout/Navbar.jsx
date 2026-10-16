import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ComplaintModal from '../ui/ComplaintModal';

export function Navbar({ onOpenFileComplaint }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState('English');
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState('Theft / Property Loss (CrPC 379)');

  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
      {/* ========================================================================= */}
      {/* 1. TOP STATUTORY & EMERGENCY HELPLINE BANNER                              */}
      {/* ========================================================================= */}
      <div className="bg-primary text-surface-container-lowest text-xs py-1 px-6 lg:px-12 flex justify-between items-center border-b border-primary-container z-40">
        <div className="flex items-center space-x-4">
          <span className="inline-flex items-center font-medium tracking-wide gap-1">
            <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse"></span>
            PUBLIC CIVIC DEMONSTRATION PLATFORM • STATUTORY GOVERNANCE CRUISE
          </span>
          <span className="hidden sm:inline text-outline-variant">|</span>
          <span className="hidden sm:inline text-surface-variant font-normal">Official CaseSync First Information Subsystem</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-1.5 text-tertiary-fixed font-semibold tracking-wider">
            <span className="material-symbols-outlined text-[15px] leading-none">emergency</span>
            <span>POLICE HELPLINE: 112</span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-surface-variant pl-2 border-l border-outline">
            <button 
              type="button"
              onClick={() => setLang('English')}
              className={`hover:text-surface-container-lowest px-1 transition-colors cursor-pointer ${lang === 'English' ? 'text-white font-semibold' : ''}`}
            >
              English
            </button>
            <span>/</span>
            <button 
              type="button"
              onClick={() => setLang('Hindi')}
              className={`hover:text-surface-container-lowest px-1 transition-colors cursor-pointer ${lang === 'Hindi' ? 'text-white font-semibold' : ''}`}
            >
              हिंदी
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STICKY MAIN NAVBAR                                                     */}
      {/* ========================================================================= */}
      <header className="docked full-width top-0 sticky z-50 bg-surface-container-lowest border-b border-outline-variant shadow-sm transition-all duration-200">
        <div className="w-full px-6 lg:px-12 py-3.5 flex items-center justify-between mx-auto">
          
          {/* Brand Anchor */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded bg-primary-container flex items-center justify-center text-surface-container-lowest shadow-sm border border-outline">
              <span className="material-symbols-outlined text-xl">shield</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-primary">CaseSync</span>
                <span className="text-[10px] font-semibold uppercase bg-surface-container text-secondary px-1.5 py-0.5 rounded border border-outline-variant tracking-wider">Gov.IN</span>
              </div>
              <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Citizen Police Services</span>
            </div>
          </Link>

          {/* Desktop Multi-Page Navigation Routes */}
          <nav className="hidden lg:flex items-center space-x-7">
            <Link 
              to="/" 
              className={`font-body-md text-body-md transition-colors ${
                location.pathname === '/' 
                  ? 'text-primary font-semibold border-b-2 border-primary pb-1' 
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/how-it-works" 
              className={`font-body-md text-body-md transition-colors ${
                location.pathname === '/how-it-works' 
                  ? 'text-primary font-semibold border-b-2 border-primary pb-1' 
                  : 'text-secondary hover:text-primary'
              }`}
            >
              FIR Journey
            </Link>
            <Link 
              to="/services" 
              className={`font-body-md text-body-md transition-colors ${
                location.pathname === '/services' 
                  ? 'text-primary font-semibold border-b-2 border-primary pb-1' 
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Services
            </Link>
            <a 
              href="/#faq" 
              className="text-secondary hover:text-primary transition-colors font-body-md text-body-md"
            >
              FAQ
            </a>
            <a 
              href="/#helpline" 
              className="text-secondary hover:text-primary transition-colors font-body-md text-body-md"
            >
              Helpline
            </a>
          </nav>

          {/* Trailing Action Controls */}
          <div className="flex items-center gap-3">
            
            {/* Track Case Quick Link */}
            <Link 
              to="/services" 
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-surface-container-lowest border border-outline-variant text-primary font-label-lg text-label-lg hover:bg-surface-container-low transition-all"
            >
              <span className="material-symbols-outlined text-lg">search</span>
              Track Case
            </Link>

            {/* Auth State Conditional Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link 
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-variant font-medium"
                >
                  <span className="material-symbols-outlined text-base">account_circle</span>
                  <span>{user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Dashboard'}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  title="Sign Out"
                  className="p-1.5 text-secondary hover:text-error hover:bg-surface-container-low rounded transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                </button>
              </div>
            ) : (
              <>
                <Link 
                  to="/login"
                  className={`hidden sm:inline-flex items-center px-3 py-2 text-primary hover:text-primary-container font-title-md text-body-md font-medium transition-colors ${
                    location.pathname === '/login' ? 'font-semibold text-primary underline underline-offset-4' : ''
                  }`}
                >
                  Sign In
                </Link>
                <Link 
                  to="/signup"
                  className={`hidden sm:inline-flex items-center px-3.5 py-1.5 text-primary bg-surface-container-lowest border border-outline-variant rounded hover:bg-surface-container-low transition-colors duration-150 font-title-md text-body-md font-medium shadow-sm ${
                    location.pathname === '/signup' ? 'ring-2 ring-primary/20' : ''
                  }`}
                >
                  Sign Up
                </Link>
              </>
            )}

            {/* File Complaint Primary CTA */}
            <button 
              type="button"
              onClick={handleFileComplaintClick}
              className="inline-flex items-center px-4 py-2 bg-primary-container text-surface-container-lowest rounded hover:bg-primary transition-colors duration-150 font-title-md text-body-md font-medium shadow-sm active:scale-[0.99] border-l-2 border-tertiary-fixed-dim cursor-pointer"
            >
              <span className="material-symbols-outlined text-base mr-1.5 text-tertiary-fixed-dim">edit_document</span>
              File Complaint
            </button>

            {/* Language Selector Toggle */}
            <button 
              type="button"
              onClick={() => setLang(lang === 'English' ? 'Hindi' : 'English')}
              className="p-2 text-secondary hover:text-primary hover:bg-surface-container-low rounded transition-colors cursor-pointer" 
              title="Change Language"
            >
              <span className="material-symbols-outlined text-xl">language</span>
            </button>

            {/* SOS Emergency Helpline */}
            <a 
              className="p-2 text-error hover:bg-error-container/20 rounded transition-colors" 
              href="tel:112" 
              title="Emergency 112"
            >
              <span className="material-symbols-outlined text-xl">emergency</span>
            </a>

            {/* Mobile Menu Hamburger */}
            <button 
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-primary hover:bg-surface-container-low rounded cursor-pointer" 
              id="mobile-menu-btn"
            >
              <span className="material-symbols-outlined text-2xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-6 py-4 bg-surface-container-lowest border-t border-outline-variant space-y-3">
            <Link onClick={() => setMobileMenuOpen(false)} className="block font-title-md text-primary py-1" to="/">Home</Link>
            <Link onClick={() => setMobileMenuOpen(false)} className="block font-title-md text-primary py-1" to="/how-it-works">FIR Journey</Link>
            <Link onClick={() => setMobileMenuOpen(false)} className="block font-title-md text-primary py-1" to="/services">Services</Link>
            <a onClick={() => setMobileMenuOpen(false)} className="block font-body-md text-secondary py-1" href="/#faq">FAQ</a>
            <a onClick={() => setMobileMenuOpen(false)} className="block font-body-md text-secondary py-1" href="/#helpline">Helpline</a>
            
            <div className="pt-3 border-t border-outline-variant flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                {isAuthenticated ? (
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-center py-2 text-primary border border-outline-variant rounded font-medium text-xs">
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-center py-2 text-primary border border-outline-variant rounded font-medium text-xs">
                      Sign In
                    </Link>
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="text-center py-2 bg-surface-container text-primary rounded font-medium text-xs">
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
              <button 
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleFileComplaintClick();
                }}
                className="w-full py-2 bg-primary-container text-surface-container-lowest rounded font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-tertiary-fixed-dim">edit_document</span> 
                File Complaint
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Global Complaint Modal (when triggered from navbar on any page) */}
      <ComplaintModal 
        isOpen={complaintModalOpen}
        onClose={() => setComplaintModalOpen(false)}
        initialCategory={modalCategory}
      />
    </>
  );
}

export default Navbar;
