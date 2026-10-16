import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import citizenPortraitImg from '../assets/images/stitch_citizen_portrait.jpg';

export function ProfilePage() {
  const { user } = useAuth();
  
  const [activeSection, setActiveSection] = useState('personal'); // 'personal' | 'identity' | 'summons' | 'security' | 'audit'
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const displayName = user?.fullName || 'Ramesh Kumar Sundaram';
  const displayEmail = user?.email || 'ramesh.sundaram@gmail.com';
  const displayPhone = user?.phone || '98765 43210';
  const [mobile, setMobile] = useState(displayPhone);
  const [email, setEmail] = useState(displayEmail);
  const [address, setAddress] = useState('Flat 402, Kaveri Apartments, Sector-C, Vasant Vihar, New Delhi - 110057');
  const [emergencyName, setEmergencyName] = useState('Sunita Sundaram (Spouse)');
  const [emergencyPhone, setEmergencyPhone] = useState('+91 98111 22334');

  // Summons toggles
  const [smsDelivery, setSmsDelivery] = useState(true);
  const [whatsappDelivery, setWhatsappDelivery] = useState(true);
  const [maskPublicName, setMaskPublicName] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen flex bg-background font-body-md text-on-surface antialiased selection:bg-secondary-fixed selection:text-primary">
      {/* Dashboard Sidebar on Desktop */}
      <DashboardSidebar activeNav="profile" />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile Navbar if screen < md */}
        <div className="md:hidden">
          <Navbar />
        </div>

        {/* Top Minimal Utility Header on Desktop */}
        <header className="hidden md:flex w-full bg-surface-container-lowest text-on-surface top-0 sticky z-30 shadow-sm border-b border-outline-variant px-6 py-2.5 items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <Link to="/" className="text-secondary font-medium hover:text-primary">Home</Link>
            <span className="text-outline-variant">/</span>
            <Link to="/dashboard" className="text-secondary font-medium hover:text-primary">Citizen Statutory Services</Link>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-bold">Citizen Profile &amp; Account Settings</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-secondary font-mono bg-surface-container-low px-2.5 py-1 rounded border border-outline-variant/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Statutory Verification Active (UIDAI Section 4)</span>
            </div>
            <Link to="/file-complaint" className="px-3 py-1 rounded bg-primary-container text-white text-xs font-semibold hover:bg-primary">
              + File e-FIR
            </Link>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Toast */}
          {saveSuccess && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-300 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
              <span>Profile preferences updated and cryptographically sealed with the Civic Registry ledger.</span>
            </div>
          )}

          {/* Primary Dossier Main Layout: 4 Cols Left Nav + 8 Cols Document */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT PROFILE NAVIGATION SIDEBAR (4 COLUMNS) */}
            <aside className="lg:col-span-4 space-y-5">
              
              {/* Settings Nav Card */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-outline-variant bg-[#FAF9F5] flex items-center justify-between">
                  <h2 className="font-title-md text-xs font-bold text-primary tracking-tight">Citizen Settings</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container font-mono text-secondary font-semibold">
                    PRO-AUTH
                  </span>
                </div>

                <nav className="p-2 space-y-1">
                  <button 
                    type="button"
                    onClick={() => setActiveSection('personal')}
                    className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-all cursor-pointer ${
                      activeSection === 'personal'
                        ? 'bg-primary-container text-white shadow-sm'
                        : 'text-secondary hover:text-primary hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg mt-0.5">badge</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-label-lg text-xs font-semibold">Personal Information &amp; KYC</span>
                        {activeSection === 'personal' && <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim"></span>}
                      </div>
                      <p className="text-[11px] opacity-80 truncate">Demographics, contacts &amp; address</p>
                    </div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setActiveSection('identity')}
                    className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-all cursor-pointer ${
                      activeSection === 'identity'
                        ? 'bg-primary-container text-white shadow-sm'
                        : 'text-secondary hover:text-primary hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg mt-0.5">verified_user</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-label-lg text-xs font-semibold">Statutory Identity &amp; DigiLocker</span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 font-semibold px-1.5 py-0.5 rounded border border-emerald-200">Linked</span>
                      </div>
                      <p className="text-[11px] opacity-80 truncate">Aadhaar, EPIC token, Gov locker</p>
                    </div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setActiveSection('summons')}
                    className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-all cursor-pointer ${
                      activeSection === 'summons'
                        ? 'bg-primary-container text-white shadow-sm'
                        : 'text-secondary hover:text-primary hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg mt-0.5">gavel</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-label-lg text-xs font-semibold block">Notification &amp; Summons</span>
                      <p className="text-[11px] opacity-80 truncate">BNSS Sec 64 digital service</p>
                    </div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setActiveSection('security')}
                    className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-all cursor-pointer ${
                      activeSection === 'security'
                        ? 'bg-primary-container text-white shadow-sm'
                        : 'text-secondary hover:text-primary hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg mt-0.5">shield_lock</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-label-lg text-xs font-semibold">Security, 2FA &amp; PIN</span>
                        <span className="text-[10px] opacity-80 font-mono">Active</span>
                      </div>
                      <p className="text-[11px] opacity-80 truncate">Session control &amp; authentication</p>
                    </div>
                  </button>
                </nav>
              </div>

              {/* Statutory Notice Rail Box */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm space-y-3">
                <div className="flex items-center space-x-2 text-primary">
                  <span className="material-symbols-outlined text-lg">account_balance</span>
                  <h3 className="font-label-lg text-xs font-bold">Statutory Integrity Advisory</h3>
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  Pursuant to the Bharatiya Nagarik Suraksha Sanhita (BNSS) and Section 4 of the Aadhaar Act, updates to legal identity attributes mandate biometric or statutory OTP re-attestation.
                </p>
                <div className="p-2.5 bg-surface-container-low rounded border border-outline-variant/50 text-[11px] text-secondary font-mono space-y-1">
                  <div className="flex justify-between"><span>Registrar:</span> <strong className="text-on-surface">UIDAI &amp; NPS</strong></div>
                  <div className="flex justify-between"><span>Audit:</span> <strong className="text-on-surface">SHA-256 Validated</strong></div>
                </div>
              </div>

              {/* Station Jurisdiction Anchor */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">Local Police Station</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded">Assigned</span>
                </div>
                <div className="text-xs">
                  <p className="font-bold text-primary">Vasant Vihar Police Station</p>
                  <p className="text-secondary mt-0.5">South West District, New Delhi - 110057</p>
                  <p className="text-secondary mt-1 font-mono">SHO In-Charge: Insp. Rajesh K. Sharma</p>
                </div>
                <Link 
                  to="/dashboard/jurisdiction"
                  className="w-full block text-center py-1.5 px-3 border border-outline-variant hover:bg-surface-container-low rounded text-xs font-semibold text-primary transition-colors"
                >
                  View Station Details
                </Link>
              </div>

            </aside>

            {/* RIGHT PRIMARY DOCUMENT CANVAS (8 COLUMNS) */}
            <section className="lg:col-span-8 space-y-6">
              
              {/* Profile Header Card */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden relative border-t-[3px] border-t-primary-container">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-5 border-b border-outline-variant">
                    {/* Citizen Avatar & Metadata Cluster */}
                    <div className="flex items-center space-x-4">
                      <div className="relative group">
                        <img 
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border-2 border-outline-variant shadow-sm" 
                          alt="Government identification portrait of Ramesh Kumar Sundaram." 
                          src={citizenPortraitImg}
                        />
                        <button 
                          type="button" 
                          onClick={() => alert('Biometric facial photo verification terminal opened.')}
                          className="absolute -bottom-1.5 -right-1.5 p-1 bg-primary text-white rounded shadow hover:bg-primary-container transition-transform active:scale-95 flex items-center justify-center cursor-pointer" 
                          title="Update photo"
                        >
                          <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                        </button>
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h1 className="font-headline-sm text-lg sm:text-xl text-primary font-bold tracking-tight">
                            {displayName}
                          </h1>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <span className="material-symbols-outlined text-xs text-emerald-700">verified</span>
                            UIDAI Aadhaar e-KYC Verified
                          </span>
                        </div>
                        <p className="font-body-sm text-secondary flex flex-wrap items-center gap-x-3 text-xs">
                          <span>Ref Token: <strong className="font-mono text-primary font-semibold">CIT-DEL-984210</strong></span>
                          <span className="text-outline-variant">•</span>
                          <span>Registered: <strong className="text-on-surface">14 Jan 2024</strong></span>
                        </p>
                      </div>
                    </div>

                    {/* Download Verification Slip */}
                    <button 
                      type="button"
                      onClick={() => window.print()}
                      className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-3.5 py-2 bg-surface-container-low hover:bg-surface-container text-primary border border-outline-variant rounded font-label-md text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      <span>Civic Verification Slip</span>
                    </button>
                  </div>

                  {/* Quick Identity Metric Chips */}
                  <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 bg-[#FAF9F5] rounded border border-outline-variant/40">
                      <span className="text-secondary block font-medium">Identity Status</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-sm">check_circle</span> Statutory Level 3
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#FAF9F5] rounded border border-outline-variant/40">
                      <span className="text-secondary block font-medium">Linked Cases</span>
                      <span className="text-primary font-bold mt-0.5 block">1 Active / 3 Disposed</span>
                    </div>
                    <div className="p-2.5 bg-[#FAF9F5] rounded border border-outline-variant/40">
                      <span className="text-secondary block font-medium">E-Summons Delivery</span>
                      <span className="text-primary font-bold mt-0.5 block">Secured SMS/WhatsApp</span>
                    </div>
                    <div className="p-2.5 bg-[#FAF9F5] rounded border border-outline-variant/40">
                      <span className="text-secondary block font-medium">Account Integrity</span>
                      <span className="text-primary font-bold mt-0.5 block">100% Complete</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Particulars Form */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-outline-variant bg-[#FAF9F5] flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-title-md text-sm font-bold text-primary tracking-tight">Personal Particulars &amp; Verified Demographics</h2>
                    <p className="font-body-sm text-xs text-secondary mt-0.5">Official citizen information recorded in the National Case Registry ledger.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      type="button" 
                      onClick={handleSave}
                      className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-primary hover:bg-primary-container text-white rounded text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">save</span>
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-5 text-xs">
                  {/* Row 1: Legal Full Name & DOB/Gender */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-primary flex items-center gap-1">
                          Legal Full Name
                          <span className="material-symbols-outlined text-xs text-secondary" title="Statutorily locked via Aadhaar">lock</span>
                        </label>
                        <span className="text-[10px] text-secondary">Locked via Aadhaar</span>
                      </div>
                      <input 
                        type="text"
                        disabled
                        value={displayName}
                        className="w-full bg-[#F3F4F6] text-secondary font-medium rounded border border-outline-variant/60 px-3 py-2 cursor-not-allowed outline-none"
                      />
                      <p className="text-[10px] text-secondary">Requires statutory gazette affidavit to alter legal nomenclature.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-primary block">Date of Birth &amp; Gender</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" readOnly value="18/06/1982" className="w-full bg-[#FAF9F5] text-on-surface rounded border border-outline-variant px-3 py-2 font-mono" />
                        <input type="text" readOnly value="Male" className="w-full bg-[#FAF9F5] text-on-surface rounded border border-outline-variant px-3 py-2" />
                      </div>
                      <p className="text-[10px] text-secondary">Age: 42 Years • Verified against National Electoral Ledger</p>
                    </div>
                  </div>

                  {/* Row 2: Mobile & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-primary block">Primary Mobile Number</label>
                      <div className="relative flex rounded">
                        <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-outline-variant bg-[#FAF9F5] text-secondary font-mono text-xs">
                          IN +91
                        </span>
                        <input 
                          type="tel"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          className="w-full rounded-none rounded-r border border-outline-variant px-3 py-2 font-mono focus:border-primary outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-secondary">Primary vector for mandatory legal SMS summons and case status dispatches.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-primary block">Official Registered Email</label>
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded border border-outline-variant px-3 py-2 focus:border-primary outline-none"
                      />
                      <p className="text-[10px] text-secondary">Digital copies of registered e-FIRs and certified charge sheets are transmitted here.</p>
                    </div>
                  </div>

                  {/* Row 3: Address */}
                  <div className="space-y-1">
                    <label className="font-semibold text-primary block">Current Residential &amp; Legal Service Address</label>
                    <textarea 
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full rounded border border-outline-variant px-3 py-2 focus:border-primary outline-none leading-relaxed"
                    />
                    <div className="flex justify-between text-[11px] text-secondary">
                      <span>Jurisdiction: South West District • Beat Zone #03</span>
                      <span className="text-emerald-700 font-medium">Police residence verification: Active</span>
                    </div>
                  </div>

                  {/* Row 4: Emergency Contact */}
                  <div className="pt-3 border-t border-outline-variant space-y-3">
                    <h3 className="font-semibold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-error">emergency_share</span>
                      Designated Emergency &amp; Next-of-Kin Contact
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-secondary block mb-1">Full Name &amp; Relationship</label>
                        <input 
                          type="text"
                          value={emergencyName}
                          onChange={(e) => setEmergencyName(e.target.value)}
                          className="w-full rounded border border-outline-variant px-3 py-2 font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-secondary block mb-1">Emergency Mobile Number</label>
                        <input 
                          type="tel"
                          value={emergencyPhone}
                          onChange={(e) => setEmergencyPhone(e.target.value)}
                          className="w-full rounded border border-outline-variant px-3 py-2 font-mono font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 5: Summons & Digital Notice Preferences */}
                  <div className="pt-3 border-t border-outline-variant space-y-3">
                    <h3 className="font-semibold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-primary">gavel</span>
                      BNSS Section 64 Digital Notice Delivery Preferences
                    </h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={smsDelivery}
                          onChange={(e) => setSmsDelivery(e.target.checked)}
                          className="rounded text-primary focus:ring-0"
                        />
                        <span>Receive instant judicial hearing notices via Registered SMS</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={whatsappDelivery}
                          onChange={(e) => setWhatsappDelivery(e.target.checked)}
                          className="rounded text-primary focus:ring-0"
                        />
                        <span>Enable official WhatsApp statutory summons dispatch</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={maskPublicName}
                          onChange={(e) => setMaskPublicName(e.target.checked)}
                          className="rounded text-primary focus:ring-0"
                        />
                        <span>Mask legal identity on public judgment search index (Data Minimization)</span>
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3 border-t border-outline-variant flex justify-end">
                    <button 
                      type="submit"
                      className="px-6 py-2.5 bg-primary text-white font-semibold rounded hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
                    >
                      Save Profile &amp; Preferences
                    </button>
                  </div>
                </form>
              </div>

            </section>

          </div>

        </main>
      </div>
    </div>
  );
}

export default ProfilePage;
