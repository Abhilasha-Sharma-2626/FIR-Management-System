import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';
import verificationCounterImg from '../assets/images/stitch_verification_counter.jpg';
import loginRegistryImg from '../assets/images/stitch_login_registry.jpg';

export function SignupPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    otp: '',
    email: '',
    idProofType: 'aadhaar',
    idNumber: '',
    password: '',
    mpin: '',
    state: 'Tamil Nadu',
    district: 'Chennai City Central',
    pincode: '600002',
    affirmation1: true,
    affirmation2: true
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState('02:45');
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');

  // Password strength calculation
  const getPasswordStrength = () => {
    const pwd = formData.password;
    if (!pwd) return { level: 0, text: 'Empty', color: 'bg-outline-variant' };
    if (pwd.length < 6) return { level: 1, text: 'Weak', color: 'bg-error' };
    if (pwd.length < 10 || !/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) {
      return { level: 2, text: 'Medium', color: 'bg-amber-500' };
    }
    return { level: 3, text: 'Strong', color: 'bg-emerald-500' };
  };

  const handleSendOtp = () => {
    if (!formData.mobile || formData.mobile.length < 10) {
      setServerError('Please enter a valid 10-digit mobile number before requesting statutory OTP.');
      return;
    }
    setServerError('');
    setOtpSent(true);
    setFormData(prev => ({ ...prev, otp: '582914' }));
    setServerSuccess('Statutory OTP 582914 dispatched to mobile number.');
  };

  const handleDigiLocker = () => {
    setFormData({
      fullName: 'Rajesh Kumar Sharma',
      mobile: '9840128392',
      otp: '582914',
      email: 'citizen.rajesh@casesync.gov.in',
      idProofType: 'aadhaar',
      idNumber: '•••• •••• 9812',
      password: 'Citizen@12345',
      mpin: '440128',
      state: 'Tamil Nadu',
      district: 'Chennai City Central',
      pincode: '600002',
      affirmation1: true,
      affirmation2: true
    });
    setOtpSent(true);
    setServerSuccess('DigiLocker verified! Aadhaar e-KYC credentials pre-populated. Submit to finalize registration.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setServerSuccess('');

    if (!formData.fullName.trim()) {
      setServerError('Full Legal Name is required per Sec 154 CrPC.');
      return;
    }

    if (!formData.mobile.trim() || formData.mobile.trim().length < 10) {
      setServerError('Valid 10-digit mobile number is mandatory.');
      return;
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setServerError('Valid official email address is required.');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setServerError('Password must be at least 6 characters.');
      return;
    }

    if (!formData.affirmation1 || !formData.affirmation2) {
      setServerError('Both statutory affirmations must be acknowledged under penalty of law.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.mobile.trim(),
        idProofType: formData.idProofType.toUpperCase(),
        idProofLast4: formData.idNumber ? formData.idNumber.slice(-4) : '9812'
      };

      const res = await register(payload);
      if (res?.success) {
        setServerSuccess('Statutory Citizen Registration Successful! Redirecting to Citizen Dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1200);
      } else {
        setServerError(res?.message || 'Registration could not be completed.');
      }
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  const pwdStrength = getPasswordStrength();

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col selection:bg-secondary-container selection:text-on-secondary-fixed">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb & Authority Header */}
        <div className="mb-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-label-md text-label-md text-secondary mb-2">
            <Link className="hover:text-primary transition-colors flex items-center gap-1" to="/">
              <span className="material-symbols-outlined text-[16px]">home</span>
              Portal Home
            </Link>
            <span className="text-outline-variant">/</span>
            <span className="text-secondary">Citizen Identity Services</span>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-semibold">Statutory Onboarding</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Citizen Security Tier 1
                </span>
                <span className="font-label-sm text-label-sm text-secondary">Sec 65B Certified Portal</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">
                Citizen Registration &amp; Identity Verification
              </h1>
              <p className="font-body-md text-body-md text-secondary max-w-2xl mt-1">
                Create an authenticated, cryptographically verifiable citizen docket to report incidents, track e-FIR status, and receive lawful court summons securely.
              </p>
            </div>

            {/* Quick Assistance Pill */}
            <div className="flex items-center gap-3 bg-surface-container-low border border-outline-variant px-4 py-2.5 rounded-lg self-start md:self-auto shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-primary-container text-[24px]">support_agent</span>
              <div>
                <div className="font-label-sm text-label-sm text-secondary">Facing Technical Issue?</div>
                <a href="tel:18004250112" className="font-title-md text-title-md text-primary leading-none hover:underline font-bold">
                  1800-425-0112 (Toll Free)
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {serverError && (
          <div className="mb-6 p-4 rounded-lg bg-error-container text-on-error-container text-xs flex items-center gap-2.5 border border-error/30 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span className="font-medium">{serverError}</span>
          </div>
        )}
        {serverSuccess && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2.5 border border-emerald-300 shadow-sm">
            <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
            <span className="font-medium">{serverSuccess}</span>
          </div>
        )}

        {/* Layout Grid: 8-col Registration Form + 4-col Civic Evidence/Assurance Rail */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT / PRIMARY COLUMN (8 Cols): Registration Form */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden relative">
              {/* Top Border Rule 3px signifying official certification */}
              <div className="h-[3px] bg-primary-container w-full"></div>

              <div className="p-6 md:p-8 space-y-8">
                
                {/* FAST-TRACK e-KYC CALLOUT */}
                <div className="p-5 rounded-lg bg-surface-container-low border border-secondary-fixed-dim/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex-shrink-0 flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[22px]">fingerprint</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-title-md text-title-md text-primary font-bold">Fast-Track via DigiLocker / Aadhaar</h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary-container text-on-primary">RECOMMENDED</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-secondary mt-0.5">
                        Instant identity verification without physical documentation review.
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={handleDigiLocker}
                    className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-secondary transition-colors duration-150 active:scale-[0.99] shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                    Verify via DigiLocker
                  </button>
                </div>

                {/* Divider with Text */}
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-outline-variant w-full"></div>
                  <span className="bg-surface-container-lowest px-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest relative">
                    Or Manual Statutory Enrolment
                  </span>
                </div>

                {/* REGISTRATION FORM */}
                <form className="space-y-6" onSubmit={handleSubmit}>
                  
                  {/* SECTION 1: Personal Particulars */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
                      <span className="font-label-lg text-label-lg text-primary font-semibold flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary-container text-on-primary text-[11px] font-bold flex items-center justify-center">1</span>
                        Legal Identity Information
                      </span>
                      <span className="font-label-sm text-label-sm text-secondary">* All fields mandatory per Sec 154 CrPC</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Legal Full Name */}
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="block font-label-md text-label-md text-primary font-medium" htmlFor="full-name">
                          Full Legal Name <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <input 
                            id="full-name"
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="As stated on statutory government identification (e.g., Rajesh Kumar Sharma)"
                            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3.5 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-secondary focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                          />
                          <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-outline">badge</span>
                        </div>
                      </div>

                      {/* Mobile Number & OTP Trigger */}
                      <div className="space-y-1.5">
                        <label className="block font-label-md text-label-md text-primary font-medium" htmlFor="mobile-phone">
                          Mobile Number <span className="text-error">*</span>
                        </label>
                        <div className="flex gap-2">
                          <div className="w-20 flex-shrink-0 flex items-center justify-center border border-outline-variant rounded-lg bg-surface-container-low font-label-md text-label-md text-primary">
                            +91 (IN)
                          </div>
                          <div className="relative flex-grow">
                            <input 
                              id="mobile-phone"
                              type="tel"
                              maxLength={10}
                              required
                              value={formData.mobile}
                              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                              placeholder="98765 43210"
                              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3.5 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-secondary focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                            />
                          </div>
                          <button 
                            type="button"
                            onClick={handleSendOtp}
                            className={`px-3.5 py-2.5 rounded-lg border font-label-md text-label-md transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                              otpSent 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                                : 'border-primary-container text-primary hover:bg-surface-container-low'
                            }`}
                          >
                            {otpSent ? 'OTP Sent' : 'Send OTP'}
                          </button>
                        </div>
                        <p className="font-body-sm text-body-sm text-secondary">Will receive verification codes &amp; emergency alerts.</p>
                      </div>

                      {/* 6-Digit OTP Input */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block font-label-md text-label-md text-primary font-medium" htmlFor="otp-code">
                            6-Digit Mobile OTP <span className="text-error">*</span>
                          </label>
                          <span className="font-label-sm text-label-sm text-secondary">Expires: {otpTimer}</span>
                        </div>
                        <div className="relative">
                          <input 
                            id="otp-code"
                            type="text"
                            maxLength={6}
                            required
                            value={formData.otp}
                            onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                            placeholder="• • • • • •"
                            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3.5 py-2.5 font-body-md text-body-md text-on-surface tracking-widest text-center focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                          />
                          <button 
                            type="button" 
                            onClick={handleSendOtp}
                            className="absolute right-2 top-2 px-2.5 py-1 text-label-sm font-label-sm text-primary hover:underline cursor-pointer"
                          >
                            Resend
                          </button>
                        </div>
                        <p className="font-body-sm text-body-sm text-emerald-700 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Simulated OTP: <strong>582914</strong> for review verification
                        </p>
                      </div>

                      {/* Email Address */}
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="block font-label-md text-label-md text-primary font-medium" htmlFor="email-address">
                          Official Email Address <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <input 
                            id="email-address"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="citizen.name@domain.gov.in / personal email"
                            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3.5 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-secondary focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                          />
                          <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-outline">mail</span>
                        </div>
                        <span className="font-body-sm text-body-sm text-secondary">
                          Certified FIR dockets and summons will be electronically served to this inbox.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: Security & Statutory Identity Type */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
                      <span className="font-label-lg text-label-lg text-primary font-semibold flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary-container text-on-primary text-[11px] font-bold flex items-center justify-center">2</span>
                        Security PIN &amp; ID Proof Verification
                      </span>
                      <span className="font-label-sm text-label-sm text-secondary">256-Bit Cryptographic Vault</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* ID Proof Selection */}
                      <div className="space-y-1.5">
                        <label className="block font-label-md text-label-md text-primary font-medium" htmlFor="id-proof-type">
                          Statutory ID Document <span className="text-error">*</span>
                        </label>
                        <select 
                          id="id-proof-type"
                          value={formData.idProofType}
                          onChange={(e) => setFormData({ ...formData, idProofType: e.target.value })}
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3.5 py-2.5 font-body-md text-body-md text-on-surface focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                        >
                          <option value="aadhaar">Aadhaar Card (Tokenized Virtual ID - Masked)</option>
                          <option value="voter">Voter Identity Card (EPIC No.)</option>
                          <option value="pan">Permanent Account Number (PAN)</option>
                          <option value="passport">Indian Passport</option>
                          <option value="dl">Driving License (State Transport)</option>
                        </select>
                      </div>

                      {/* ID Number Input */}
                      <div className="space-y-1.5">
                        <label className="block font-label-md text-label-md text-primary font-medium" htmlFor="id-number">
                          Document Identification Number <span className="text-error">*</span>
                        </label>
                        <input 
                          id="id-number"
                          type="text"
                          required
                          value={formData.idNumber}
                          onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                          placeholder="Enter alphanumeric reference number"
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3.5 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-secondary uppercase focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                        />
                      </div>

                      {/* Password / Portal PIN */}
                      <div className="space-y-1.5">
                        <label className="block font-label-md text-label-md text-primary font-medium" htmlFor="passcode">
                          Create Master Portal Password <span className="text-error">*</span>
                        </label>
                        <input 
                          id="passcode"
                          type="password"
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Min. 8 chars, 1 uppercase, 1 symbol"
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3.5 py-2.5 font-body-md text-body-md text-on-surface focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                        />
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className={`h-1.5 flex-1 rounded-full ${pwdStrength.level >= 1 ? pwdStrength.color : 'bg-outline-variant'}`}></div>
                          <div className={`h-1.5 flex-1 rounded-full ${pwdStrength.level >= 2 ? pwdStrength.color : 'bg-outline-variant'}`}></div>
                          <div className={`h-1.5 flex-1 rounded-full ${pwdStrength.level >= 3 ? pwdStrength.color : 'bg-outline-variant'}`}></div>
                          <span className="font-label-sm text-label-sm font-semibold ml-1 text-primary">
                            {pwdStrength.text}
                          </span>
                        </div>
                      </div>

                      {/* Quick 6-Digit MPIN for Mobile Access */}
                      <div className="space-y-1.5">
                        <label className="block font-label-md text-label-md text-primary font-medium" htmlFor="mpin">
                          Set 6-Digit Quick MPIN <span className="text-error">*</span>
                        </label>
                        <input 
                          id="mpin"
                          type="password"
                          maxLength={6}
                          required
                          value={formData.mpin}
                          onChange={(e) => setFormData({ ...formData, mpin: e.target.value })}
                          placeholder="• • • • • •"
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3.5 py-2.5 font-body-md text-body-md text-on-surface tracking-widest focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                        />
                        <span className="font-body-sm text-body-sm text-secondary">For rapid authorization during IO phone check-ins.</span>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: Jurisdiction & Residential Bounds */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
                      <span className="font-label-lg text-label-lg text-primary font-semibold flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary-container text-on-primary text-[11px] font-bold flex items-center justify-center">3</span>
                        Residential Jurisdiction &amp; Station Mapping
                      </span>
                      <span className="font-label-sm text-label-sm text-secondary">Automated Police Station Mapping</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="block font-label-md text-label-md text-primary font-medium" htmlFor="state-select">
                          State / UT <span className="text-error">*</span>
                        </label>
                        <select 
                          id="state-select"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 font-body-md text-body-md text-on-surface focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                        >
                          <option>Tamil Nadu</option>
                          <option>Delhi (NCT)</option>
                          <option>Maharashtra</option>
                          <option>Karnataka</option>
                          <option>Uttar Pradesh</option>
                          <option>West Bengal</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block font-label-md text-label-md text-primary font-medium" htmlFor="district-select">
                          Police Commissionerate / District <span className="text-error">*</span>
                        </label>
                        <select 
                          id="district-select"
                          value={formData.district}
                          onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 font-body-md text-body-md text-on-surface focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                        >
                          <option>Chennai City Central</option>
                          <option>Chennai City North</option>
                          <option>Chennai City South</option>
                          <option>Tambaram</option>
                          <option>Avadi</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block font-label-md text-label-md text-primary font-medium" htmlFor="pincode-input">
                          Postal Pincode <span className="text-error">*</span>
                        </label>
                        <input 
                          id="pincode-input"
                          type="text"
                          maxLength={6}
                          required
                          value={formData.pincode}
                          onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 font-body-md text-body-md text-on-surface font-semibold focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Assigned Police Station Indicator Badge */}
                    <div className="bg-surface-container border border-outline-variant rounded-lg p-3 flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-[20px]">policy</span>
                      <div className="font-body-sm text-body-sm text-on-surface flex-grow">
                        Mapped Primary Station House: <strong>E-1 Mylapore Police Station</strong> (SHO Contact: +91 44 2345 2582)
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-container-lowest border border-outline-variant text-secondary">
                        Verified Jurisdiction
                      </span>
                    </div>
                  </div>

                  {/* SECTION 4: Statutory Legal Declarations */}
                  <div className="space-y-3 pt-2 bg-surface-container-low p-4 rounded-lg border border-outline-variant">
                    <div className="flex items-start gap-3">
                      <input 
                        id="affirmation-1"
                        type="checkbox"
                        required
                        checked={formData.affirmation1}
                        onChange={(e) => setFormData({ ...formData, affirmation1: e.target.checked })}
                        className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-0 cursor-pointer"
                      />
                      <label className="font-body-sm text-body-sm text-on-surface select-none cursor-pointer" htmlFor="affirmation-1">
                        <strong>Statutory Truth Declaration:</strong> I solemnly declare under penalty of perjury under Section 199 &amp; 200 of the Indian Penal Code / Bharatiya Nyaya Sanhita that all particulars submitted herein are true, verifiable, and legally authentic.
                      </label>
                    </div>

                    <div className="flex items-start gap-3">
                      <input 
                        id="affirmation-2"
                        type="checkbox"
                        required
                        checked={formData.affirmation2}
                        onChange={(e) => setFormData({ ...formData, affirmation2: e.target.checked })}
                        className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-0 cursor-pointer"
                      />
                      <label className="font-body-sm text-body-sm text-on-surface select-none cursor-pointer" htmlFor="affirmation-2">
                        <strong>Electronic Service Consent:</strong> I acknowledge and consent to receive official police updates, IO summoning orders, and signed e-FIR dockets through SMS, WhatsApp, and registered electronic mail under Section 65B of the Indian Evidence Act.
                      </label>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-on-primary font-title-md text-title-md hover:bg-secondary transition-colors duration-150 active:scale-[0.99] shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Verifying Credentials...
                        </span>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                          Create Citizen Account &amp; Verify
                        </>
                      )}
                    </button>
                    <div className="text-center sm:text-right">
                      <span className="font-body-sm text-body-sm text-secondary">Existing registered citizen?</span>
                      <Link className="font-title-md text-title-md text-primary ml-1.5 underline decoration-2 underline-offset-4 hover:text-secondary font-semibold" to="/login">
                        Sign In Here
                      </Link>
                    </div>
                  </div>

                  {/* Security Badges Footer inside card */}
                  <div className="pt-4 border-t border-outline-variant flex flex-wrap items-center justify-between gap-3 text-secondary font-label-sm text-label-sm">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-emerald-700">lock</span>
                      256-Bit TLS End-to-End Encryption
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                      UIDAI Tokenized Compliant
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">gavel</span>
                      CERT-In Audited Architecture
                    </span>
                  </div>
                </form>

              </div>
            </div>
          </div>

          {/* RIGHT COLUMN / CIVIC EVIDENCE & ASSURANCE RAIL (4 Cols) */}
          <aside className="lg:col-span-5 xl:col-span-4 space-y-6">
            
            {/* Citizen Identity Verification Counter Hero Card */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
              <div className="relative h-64 w-full overflow-hidden bg-surface-container-high">
                <img 
                  className="w-full h-full object-cover" 
                  alt="A dignified, brightly lit civic hall inside an Indian police administrative center and identity verification counter." 
                  src={verificationCounterImg || loginRegistryImg}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex items-end p-4">
                  <div className="text-surface-container-lowest">
                    <div className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary-fixed-dim font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      Tamil Nadu Police Directorate
                    </div>
                    <div className="font-title-md text-title-md font-bold">Counter 4: Identity Verification &amp; e-FIR Cell</div>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[24px] flex-shrink-0">assignment_turned_in</span>
                  <div>
                    <h3 className="font-title-md text-title-md text-primary font-bold">Civic Charter &amp; Non-Emergency Assurance</h3>
                    <p className="font-body-sm text-body-sm text-secondary mt-1">
                      Empowering every citizen with statutory transparency. No physical queue required for non-heinous loss reports, theft complaints, and identity certificates.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Why Verify Account Bento Card */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm space-y-4">
              <div className="border-b border-outline-variant/60 pb-3 flex items-center justify-between">
                <h3 className="font-title-md text-title-md text-primary font-bold">Verified Account Privileges</h3>
                <span className="material-symbols-outlined text-primary">security</span>
              </div>
              <ul className="space-y-3.5">
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-surface-container text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  </div>
                  <div>
                    <strong className="font-label-lg text-label-lg text-primary block">Instant Digital Docket</strong>
                    <span className="font-body-sm text-body-sm text-secondary">Immediate acknowledgment receipt with legal barcode hash accepted by insurance &amp; banks.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-surface-container text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[16px]">timeline</span>
                  </div>
                  <div>
                    <strong className="font-label-lg text-label-lg text-primary block">Live Investigation Timeline</strong>
                    <span className="font-body-sm text-body-sm text-secondary">View investigating officer (IO) assignment, spot inspection notes, and chargesheet filings.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-surface-container text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[16px]">mark_chat_read</span>
                  </div>
                  <div>
                    <strong className="font-label-lg text-label-lg text-primary block">Secure IO Messaging</strong>
                    <span className="font-body-sm text-body-sm text-secondary">Submit supplementary digital photos, CCTV footage, or invoices directly into evidence logs.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-surface-container text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                  </div>
                  <div>
                    <strong className="font-label-lg text-label-lg text-primary block">Judicial QR Certified PDFs</strong>
                    <span className="font-body-sm text-body-sm text-secondary">Download digitally signed FIR copies validated by Station House Officer e-Signatures.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Statutory Emergency Alert Callout */}
            <div className="bg-error-container/40 border border-error/30 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-error font-title-md text-title-md font-bold">
                <span className="material-symbols-outlined text-[20px]">emergency_home</span>
                Emergency Life Safety Protocol
              </div>
              <p className="font-body-sm text-body-sm text-on-error-container">
                If you are witnessing an ongoing violent crime, medical distress, or require immediate on-scene police dispatch, <strong>do not wait to complete online registration</strong>.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <a className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-error text-on-error font-title-md text-title-md hover:opacity-90 transition-opacity font-semibold" href="tel:112">
                  <span className="material-symbols-outlined text-[18px]">call</span>
                  Dial 112 (Police &amp; EMS)
                </a>
                <span className="font-label-sm text-label-sm text-on-error-container">Toll-free emergency line</span>
              </div>
            </div>

            {/* Investigation Officer Designation Sign-off Sample */}
            <div className="bg-surface-container-low border border-dashed border-outline rounded-xl p-4 text-secondary font-body-sm text-body-sm space-y-2">
              <div className="flex items-center justify-between font-label-sm text-label-sm uppercase tracking-wider text-primary">
                <span>Identity Node: CN-9842</span>
                <span className="text-emerald-800 font-bold">• System Online</span>
              </div>
              <p className="text-[12px] leading-relaxed">
                Statutory records registered through this terminal are logged on tamper-evident immutable ledgers per National Cyber Crime Reporting Standards (NCRP).
              </p>
            </div>

          </aside>

        </div>
      </main>

      {/* Unified Footer */}
      <Footer />
    </div>
  );
}

export default SignupPage;
