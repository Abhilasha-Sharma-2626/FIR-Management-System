import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import loginRegistryImg from '../assets/images/stitch_login_registry.jpg';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form states
  const [role, setRole] = useState('CITIZEN'); // 'CITIZEN' | 'OFFICER'
  const [authProtocol, setAuthProtocol] = useState('password'); // 'otp' | 'password'
  const [identifier, setIdentifier] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  // Handle Demo Fill
  const handleDemoFill = (selectedRole) => {
    setRole(selectedRole === 'CITIZEN' ? 'CITIZEN' : 'OFFICER');
    setAuthProtocol('password');
    setServerError('');
    setServerSuccess('');

    if (selectedRole === 'CITIZEN') {
      setIdentifier('citizen.priya@casesync.gov.in');
      setPasscode('Citizen@12345');
    } else if (selectedRole === 'SHO') {
      setIdentifier('sho.central@casesync.gov.in');
      setPasscode('Officer@12345');
    } else if (selectedRole === 'IO') {
      setIdentifier('io.central@casesync.gov.in');
      setPasscode('Officer@12345');
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setServerError('');
    setServerSuccess('');

    if (!identifier.trim()) {
      setServerError('Please enter your registered mobile number or email ID.');
      return;
    }

    if (!passcode.trim()) {
      setServerError('Please enter your passcode or security verification PIN.');
      return;
    }

    setIsLoading(true);

    try {
      // If user provided a numeric mobile number, map to known demo or formatted email
      let loginEmail = identifier.trim().toLowerCase();
      if (/^\d{10}$/.test(loginEmail)) {
        if (role === 'OFFICER') {
          loginEmail = 'sho.central@casesync.gov.in';
        } else {
          loginEmail = 'citizen.priya@casesync.gov.in';
        }
      }

      const res = await login(loginEmail, passcode);
      setServerSuccess(`Identity Verified! Welcome, ${res.user?.fullName || res.user?.email}`);
      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
    } catch (err) {
      setServerError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDigiLocker = () => {
    handleDemoFill('CITIZEN');
    setServerSuccess('DigiLocker Aadhaar e-KYC verified! Click Sign In to proceed.');
  };

  return (
    <div className="bg-background text-on-background font-body-md antialiased selection:bg-primary selection:text-on-primary min-h-screen flex flex-col justify-between">
      
      {/* Universal CaseSync Navigation Bar */}
      <Navbar />

      {/* ========================================================================= */}
      {/* Contextual Breadcrumb & Statutory Sub-Banner                             */}
      {/* ========================================================================= */}
      <div className="bg-surface-container-low border-b border-outline-variant py-2.5 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between text-body-sm font-body-sm text-secondary gap-2">
          <nav className="flex items-center gap-2">
            <Link className="hover:text-primary transition-colors flex items-center gap-1" to="/">
              <span className="material-symbols-outlined text-sm">home</span>
              Home
            </Link>
            <span className="text-outline-variant">/</span>
            <span className="text-secondary">Portal Authentication</span>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-medium">Citizen &amp; Officer Sign In</span>
          </nav>
          <div className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Secure Core Node: DEL-CENTRAL-04 (Statutory Auth Gateway v4.8)</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Main Authentication Dossier Canvas (Split Screen Architecture)            */}
      {/* ========================================================================= */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          
          {/* Left Column: The Interactive Authentication Dossier (7 Cols) */}
          <section className="lg:col-span-7 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6 sm:p-8 lg:p-10 relative overflow-hidden flex flex-col justify-between">
            {/* Physical Document Metaphor: 3px Navy Certification Bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary-container"></div>
            
            <div>
              {/* Statutory Seal Header */}
              <div className="flex items-start justify-between mb-6 pb-5 border-b border-outline-variant">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-label-sm font-label-sm uppercase tracking-wide mb-2">
                    <span className="material-symbols-outlined text-xs">verified_user</span>
                    Unified Police Service Gateway
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Sign In to CaseSync</h1>
                  <p className="font-body-md text-body-md text-secondary mt-1">
                    Access your filed complaints, track real-time investigation milestones, or authenticate via departmental credentials.
                  </p>
                </div>
                <div className="hidden sm:flex flex-col items-center justify-center p-2 rounded border border-outline-variant bg-surface-container-low text-center min-w-[72px]">
                  <span className="material-symbols-outlined text-primary text-2xl">gavel</span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-secondary mt-1">Sec. 154 CrPC</span>
                </div>
              </div>

              {/* Segmented Role Selector */}
              <div className="mb-6">
                <label className="block text-label-sm font-label-sm uppercase text-secondary tracking-wider mb-2">
                  Select User Authority Profile
                </label>
                <div className="grid grid-cols-2 p-1 bg-surface-container-low rounded border border-outline-variant gap-1">
                  <button 
                    type="button"
                    onClick={() => {
                      setRole('CITIZEN');
                      setServerError('');
                    }}
                    className={`py-2.5 px-4 text-center rounded text-label-lg font-label-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      role === 'CITIZEN'
                        ? 'bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/60 font-semibold'
                        : 'text-secondary hover:text-primary hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">person</span>
                    Citizen / Complainant
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setRole('OFFICER');
                      setServerError('');
                    }}
                    className={`py-2.5 px-4 text-center rounded text-label-lg font-label-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      role === 'OFFICER'
                        ? 'bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/60 font-semibold'
                        : 'text-secondary hover:text-primary hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">shield_person</span>
                    Investigating Officer / SHO
                    <span className="text-[10px] bg-primary text-surface-container-lowest font-semibold px-1.5 py-0.5 rounded ml-1">Gov SSO</span>
                  </button>
                </div>
              </div>

              {/* Auth Mode Toggle */}
              <div className="flex items-center justify-between mb-5 bg-surface-container-low p-2.5 rounded border border-outline-variant">
                <span className="text-label-md font-label-md text-on-surface-variant font-medium">Authentication Protocol</span>
                <div className="flex items-center gap-4 text-body-sm font-body-sm">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="radio" 
                      name="auth_protocol" 
                      checked={authProtocol === 'otp'}
                      onChange={() => setAuthProtocol('otp')}
                      className="w-4 h-4 text-primary focus:ring-primary border-outline-variant"
                    />
                    <span className={authProtocol === 'otp' ? 'text-primary font-medium' : 'text-secondary'}>Mobile Number + OTP</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="radio" 
                      name="auth_protocol" 
                      checked={authProtocol === 'password'}
                      onChange={() => setAuthProtocol('password')}
                      className="w-4 h-4 text-primary focus:ring-primary border-outline-variant"
                    />
                    <span className={authProtocol === 'password' ? 'text-primary font-medium' : 'text-secondary'}>Password / National ID</span>
                  </label>
                </div>
              </div>

              {/* Quick Demo Credentials Toolbar */}
              <div className="mb-4 p-2.5 rounded bg-surface border border-dashed border-outline flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-secondary font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-tertiary-fixed-dim">key</span>
                  1-Click Demonstration Login:
                </span>
                <div className="flex items-center gap-1.5">
                  <button 
                    type="button" 
                    onClick={() => handleDemoFill('CITIZEN')}
                    className="px-2 py-1 bg-surface-container text-primary rounded text-[11px] font-semibold hover:bg-surface-variant cursor-pointer"
                  >
                    Citizen Demo
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleDemoFill('SHO')}
                    className="px-2 py-1 bg-surface-container text-primary rounded text-[11px] font-semibold hover:bg-surface-variant cursor-pointer"
                  >
                    SHO Demo
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleDemoFill('IO')}
                    className="px-2 py-1 bg-surface-container text-primary rounded text-[11px] font-semibold hover:bg-surface-variant cursor-pointer"
                  >
                    IO Demo
                  </button>
                </div>
              </div>

              {/* Error / Success Feedback */}
              {serverError && (
                <div className="mb-4 p-3 rounded bg-error-container text-on-error-container text-xs flex items-center gap-2 border border-error/20">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{serverError}</span>
                </div>
              )}
              {serverSuccess && (
                <div className="mb-4 p-3 rounded bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200">
                  <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                  <span>{serverSuccess}</span>
                </div>
              )}

              {/* Sign-In Form Body */}
              <form onSubmit={handleSignIn} className="space-y-4">
                
                {/* Mobile / National ID Field */}
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1.5" htmlFor="identifier">
                    {authProtocol === 'otp' ? 'Registered Mobile Number' : 'Registered Mobile Number or Email ID'} <span className="text-error">*</span>
                  </label>
                  <div className="relative flex rounded">
                    <span className="inline-flex items-center px-3.5 rounded-l border border-r-0 border-outline-variant bg-surface-container-low text-secondary font-body-md text-body-md select-none">
                      🇮🇳 +91
                    </span>
                    <input 
                      id="identifier"
                      type={authProtocol === 'otp' ? 'tel' : 'text'}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={authProtocol === 'otp' ? '98765 43210' : 'citizen.priya@casesync.gov.in'}
                      className="block w-full rounded-none rounded-r border border-outline-variant px-3.5 py-2.5 text-body-md font-body-md text-on-surface placeholder:text-secondary focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all bg-surface-container-lowest"
                      required
                    />
                  </div>
                  <p className="font-body-sm text-body-sm text-secondary mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">info</span>
                    {authProtocol === 'otp' 
                      ? 'One-Time Password will be dispatched via statutory SMS & WhatsApp alert.'
                      : 'You may enter your registered 10-digit mobile number or government citizen email.'}
                  </p>
                </div>

                {/* Password or Verification PIN Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-label-md text-label-md text-on-surface" htmlFor="passcode">
                      {authProtocol === 'otp' ? 'One-Time Passcode (OTP)' : 'Citizen Passcode / Account Password'}
                    </label>
                    <button 
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="font-label-sm text-label-sm text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Forgot Password / Reset PIN?
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      id="passcode"
                      type={showPassword ? 'text' : 'password'}
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder={authProtocol === 'otp' ? 'Enter 6-digit OTP' : 'Enter security password'}
                      className="block w-full rounded border border-outline-variant px-3.5 py-2.5 text-body-md font-body-md text-on-surface placeholder:text-secondary focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all bg-surface-container-lowest pr-10"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary hover:text-primary cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Affirmation & Device Trust Checkbox */}
                <div className="pt-1 flex items-start gap-2.5">
                  <input 
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-outline-variant text-primary-container focus:ring-primary-container/20 cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="font-body-sm text-body-sm text-secondary cursor-pointer">
                    Keep me authenticated on this civic terminal. <span className="text-on-surface-variant font-medium">(Do not check on shared cyber-cafe or public kiosk hardware).</span>
                  </label>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded bg-primary-container text-surface-container-lowest font-title-md text-title-md hover:bg-[#1e3158] active:bg-[#0f172a] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Verifying Statutory Credentials...
                      </span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">lock</span>
                        Sign In Securely
                      </>
                    )}
                  </button>
                </div>

                {/* Identity Federation Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-outline-variant"></div>
                  </div>
                  <div className="relative flex justify-center text-label-sm font-label-sm">
                    <span className="bg-surface-container-lowest px-3 text-secondary uppercase tracking-wider">
                      Or Statutory Instant Access
                    </span>
                  </div>
                </div>

                {/* DigiLocker Quick Sign-In Button */}
                <button 
                  type="button"
                  onClick={handleDigiLocker}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded bg-surface-container-lowest border border-outline-variant text-primary hover:bg-surface-container-low hover:border-secondary transition-all font-label-lg text-label-lg shadow-sm cursor-pointer"
                >
                  <div className="w-5 h-5 flex items-center justify-center bg-blue-700 text-white rounded text-[11px] font-bold">
                    D
                  </div>
                  <span>Sign in with DigiLocker</span>
                  <span className="text-label-sm font-label-sm bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-medium ml-1">
                    Verified Aadhaar API
                  </span>
                </button>

              </form>

              {/* Citizen Onboarding Footer */}
              <div className="mt-6 pt-5 border-t border-outline-variant text-center">
                <p className="font-body-sm text-body-sm text-secondary">
                  Don't have a citizen account?{' '}
                  <Link 
                    to="/signup" 
                    className="font-semibold text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary transition-all"
                  >
                    Register / Sign Up here
                  </Link>{' '}
                  to lodge legal complaints and receive statutory SMS receipts.
                </p>
              </div>

            </div>

            {/* Security Compliance Badges */}
            <div className="mt-8 pt-4 border-t border-outline-variant grid grid-cols-3 gap-2 text-center">
              <div className="flex items-center justify-center gap-1.5 text-label-sm font-label-sm text-secondary">
                <span className="material-symbols-outlined text-sm text-emerald-700">lock</span>
                256-Bit TLS Encryption
              </div>
              <div className="flex items-center justify-center gap-1.5 text-label-sm font-label-sm text-secondary border-x border-outline-variant">
                <span className="material-symbols-outlined text-sm text-primary">shield</span>
                CERT-In Audited
              </div>
              <div className="flex items-center justify-center gap-1.5 text-label-sm font-label-sm text-secondary">
                <span className="material-symbols-outlined text-sm text-secondary">account_balance</span>
                Statutory Privacy Firewall
              </div>
            </div>

          </section>

          {/* Right Column: Visual Trust Canvas & Citizen Guidance Dossier (5 Cols) */}
          <aside className="lg:col-span-5 flex flex-col gap-6 justify-between">
            
            {/* Photographic Trust Hero Card */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
              <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-surface-container">
                <img 
                  alt="Documentary photography of a bright, orderly Indian civic police administrative registry counter. Citizens in traditional and formal attire sit patiently with female and male administrative officers at tidy wooden desks with identity verification terminals." 
                  className="w-full h-full object-cover object-center filter saturate-[0.95]" 
                  src={loginRegistryImg}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-container/90 via-primary-container/30 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-surface-container-lowest">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-container-lowest/20 backdrop-blur-sm border border-surface-container-lowest/30 text-surface-container-lowest mb-1.5">
                    Frontline Civic Redressal
                  </span>
                  <p className="font-headline-sm text-headline-sm font-bold leading-snug">
                    Transparent. Accountable. Digital Justice.
                  </p>
                </div>
              </div>

              <div className="p-6">
                <blockquote className="italic font-body-md text-body-md text-secondary border-l-2 border-primary-container pl-3.5 mb-5">
                  “Empowering every citizen with transparent, timestamped access to justice and case milestones without physical police station friction.”
                </blockquote>

                {/* Three Pillars of e-FIR Tracking */}
                <div className="space-y-3.5 pt-1">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded bg-surface-container flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-base">folder_managed</span>
                    </div>
                    <div>
                      <h4 className="font-label-lg text-label-lg font-semibold text-primary">Instant Case Docket Access</h4>
                      <p className="font-body-sm text-body-sm text-secondary">Download legally valid signed copies of your registered First Information Reports 24/7.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded bg-surface-container flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-base">speed</span>
                    </div>
                    <div>
                      <h4 className="font-label-lg text-label-lg font-semibold text-primary">Direct IO Communication Log</h4>
                      <p className="font-body-sm text-body-sm text-secondary">Review investigating officer assignments and statutory deadline reminders with timestamp audits.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded bg-surface-container flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-base">fingerprint</span>
                    </div>
                    <div>
                      <h4 className="font-label-lg text-label-lg font-semibold text-primary">Legally Certified Copies</h4>
                      <p className="font-body-sm text-body-sm text-secondary">Judicially recognized QR-code certified documents admitted under Section 65B Indian Evidence Act.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Redirection Notice */}
            <div className="bg-surface-container-lowest rounded-xl border-l-4 border-l-error border border-outline-variant p-5 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded bg-error-container text-on-error-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-xl">warning</span>
                </div>
                <div>
                  <h3 className="font-title-md text-title-md text-error font-semibold">Immediate Emergency Alert</h3>
                  <p className="font-body-sm text-body-sm text-secondary mt-1">
                    If you are currently experiencing an active crime, physical threat, or immediate danger to life or property, do not wait for portal authentication.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <a className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-error text-surface-container-lowest text-label-md font-label-md hover:bg-[#991b1b] transition-colors shadow-sm" href="tel:112">
                      <span className="material-symbols-outlined text-base">call</span>
                      Dial Emergency 112
                    </a>
                    <a className="text-label-md font-label-md text-primary font-semibold hover:underline" href="tel:1091">
                      Women Helpline 1091
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </aside>

        </div>
      </main>

      {/* ========================================================================= */}
      {/* Footer                                                                    */}
      {/* ========================================================================= */}
      <footer className="w-full bg-primary border-t border-primary-container text-primary-fixed mt-12">
        <div className="w-full px-6 lg:px-12 py-8 flex flex-col md:flex-row justify-between items-center gap-6 max-w-7xl mx-auto">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              <span className="material-symbols-outlined text-tertiary-fixed-dim">local_police</span>
              <span className="font-headline-sm text-headline-sm font-bold text-surface-container-lowest">
                CaseSync
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-primary-container">
              © 2025 CaseSync • National Police Service &amp; Law Enforcement Technical Directorate. Academic Demonstration Prototype under Statutory Governance Framework.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-on-primary-container">
            <Link to="/#fir-journey" className="hover:text-surface-container-lowest transition-colors">Statutory SOP</Link>
            <Link to="/#faq" className="hover:text-surface-container-lowest transition-colors">Privacy Charter</Link>
            <Link to="/#transparency" className="hover:text-surface-container-lowest transition-colors">Audit Ledger</Link>
            <a href="tel:112" className="text-tertiary-fixed-dim hover:underline font-semibold">Emergency SOS: 112</a>
          </div>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-[#14213D]/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-lg border border-outline-variant shadow-xl p-6">
            <h3 className="font-headline-sm font-bold text-primary mb-2">Reset Passcode / PIN</h3>
            <p className="text-xs text-secondary mb-4">
              Enter your registered mobile number or email address. A statutory verification link will be transmitted to you.
            </p>
            <input 
              type="text"
              value={forgotInput}
              onChange={(e) => setForgotInput(e.target.value)}
              placeholder="e.g. 9876543210 or your email"
              className="w-full text-xs px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded mb-3"
            />
            {forgotMsg && (
              <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded mb-3 font-medium">
                {forgotMsg}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotMsg('');
                  setForgotInput('');
                }}
                className="px-3.5 py-1.5 text-xs border border-outline-variant rounded text-secondary hover:bg-surface-container cursor-pointer"
              >
                Close
              </button>
              <button 
                type="button"
                onClick={() => {
                  if (forgotInput) {
                    setForgotMsg('Statutory OTP token dispatched to registered contact info.');
                  }
                }}
                className="px-4 py-1.5 text-xs bg-primary-container text-white font-medium rounded hover:bg-primary cursor-pointer"
              >
                Send Reset Token
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default LoginPage;
