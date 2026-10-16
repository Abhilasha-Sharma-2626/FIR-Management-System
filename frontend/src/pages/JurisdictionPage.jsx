import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import Navbar from '../components/layout/Navbar';

export function JurisdictionPage() {
  const [searchLocation, setSearchLocation] = useState('Vasant Vihar, Munirka, 110057');
  const [district, setDistrict] = useState('South West District');
  const [stationType, setStationType] = useState('all');
  const [gpsDetected, setGpsDetected] = useState(true);

  const handleDetectGps = () => {
    setGpsDetected(true);
    setSearchLocation('Vasant Vihar, Munirka, 110057 (GPS: 28.5603° N, 77.1620° E)');
  };

  return (
    <div className="min-h-screen flex bg-background font-body-md text-on-surface antialiased selection:bg-secondary-fixed selection:text-primary">
      {/* Dashboard Sidebar on Desktop */}
      <DashboardSidebar activeNav="jurisdiction" />

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
            <span className="text-primary font-bold">Jurisdictional Station Locator</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-secondary font-mono bg-surface-container-low px-2.5 py-1 rounded border border-outline-variant/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>GIS Boundary Network: Synchronized with National Police Grid</span>
            </div>
            <Link to="/file-complaint" className="px-3 py-1 rounded bg-primary-container text-white text-xs font-semibold hover:bg-primary">
              + File e-FIR
            </Link>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Hero Header with Institutional Notice */}
          <section className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-surface-variant text-on-secondary-fixed-variant rounded border border-outline-variant/70 font-label-sm text-xs uppercase tracking-wider font-semibold">
              <span className="material-symbols-outlined text-[15px]">corporate_fare</span>
              Statutory Station Directory
            </div>
            <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary tracking-tight">
              Find Your Local Police Station &amp; Jurisdiction
            </h1>
            <p className="font-body-md text-sm text-secondary max-w-4xl leading-relaxed">
              Locate your territorial police jurisdiction, station in-charge contact numbers, supervisory officers, and citizen facilitation desks. Zero-FIR protocol guarantees complaint acceptance at any station.
            </p>
          </section>

          {/* Search & Filter Controls Panel */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 md:p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
              {/* Search bar with geolocate */}
              <div className="lg:col-span-8 relative">
                <label className="sr-only" htmlFor="station-search">Search police station by street or pincode</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-secondary material-symbols-outlined text-lg">search</span>
                  <input 
                    id="station-search"
                    type="text"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    placeholder="Enter street, locality, pincode, landmark, or metro station"
                    className="w-full pl-11 pr-32 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface placeholder:text-secondary font-body-md text-xs sm:text-sm focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all outline-none"
                  />
                  <button 
                    type="button"
                    onClick={handleDetectGps}
                    className="absolute right-2 px-3 py-1 bg-surface-container-low hover:bg-surface-container text-primary font-label-md text-xs rounded border border-outline-variant flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">my_location</span>
                    Detect GPS
                  </button>
                </div>
              </div>

              {/* Submit Search button */}
              <div className="lg:col-span-4 flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => alert(`Verified jurisdiction for: ${searchLocation}`)}
                  className="w-full py-2.5 px-5 bg-primary-container hover:bg-primary text-white rounded-lg font-label-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.99] shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">travel_explore</span>
                  Verify Jurisdiction
                </button>
              </div>
            </div>

            {/* Filter Dropdowns Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-outline-variant/60">
              <div>
                <label className="block font-label-sm text-[11px] text-secondary uppercase tracking-wider mb-1 font-semibold">
                  Police District / Zone
                </label>
                <select 
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-on-surface font-body-sm text-xs focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
                >
                  <option>South West District</option>
                  <option>New Delhi District</option>
                  <option>Central District</option>
                  <option>South District</option>
                </select>
              </div>

              <div>
                <label className="block font-label-sm text-[11px] text-secondary uppercase tracking-wider mb-1 font-semibold">
                  Sub-Division (ACP Division)
                </label>
                <select 
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-on-surface font-body-sm text-xs focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
                >
                  <option>Vasant Vihar Sub-Division</option>
                  <option>Delhi Cantt Sub-Division</option>
                  <option>Safdarjung Enclave Sub-Division</option>
                </select>
              </div>

              <div>
                <label className="block font-label-sm text-[11px] text-secondary uppercase tracking-wider mb-1 font-semibold">
                  Station Type
                </label>
                <select 
                  value={stationType}
                  onChange={(e) => setStationType(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-on-surface font-body-sm text-xs focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
                >
                  <option value="all">All Stations (General &amp; Specialized)</option>
                  <option value="territorial">Territorial Police Station</option>
                  <option value="cyber">Cyber Crime Police Station</option>
                  <option value="women">Special Women Police Station</option>
                </select>
              </div>
            </div>
          </section>

          {/* ================= INTERACTIVE SPLIT VIEW (Dossier Layout) ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Station Directory Cards (7 Columns) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-title-md text-sm font-bold text-primary">Identified Jurisdictional Stations</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-primary font-label-sm text-xs font-semibold">3 Found</span>
                </div>
                <span className="text-secondary font-label-sm text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-emerald-700">verified</span>
                  Direct Territory Match
                </span>
              </div>

              {/* 1. FEATURED ACTIVE STATION CARD */}
              <article className="bg-surface-container-lowest border-2 border-primary-container rounded-xl shadow-sm overflow-hidden relative transition-all">
                {/* Official accent bar */}
                <div className="h-1.5 bg-primary-container w-full"></div>

                <div className="p-6 space-y-5">
                  {/* Header Badges & Title */}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-outline-variant/60 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded font-label-sm text-[11px] uppercase tracking-wider font-semibold">
                          Primary Jurisdiction
                        </span>
                        <span className="px-2 py-0.5 bg-surface-container text-primary rounded font-label-sm text-xs font-mono">
                          Station Code: PS-04
                        </span>
                      </div>
                      <h2 className="font-headline-sm text-xl font-bold text-primary">
                        Vasant Vihar Police Station
                      </h2>
                      <p className="text-secondary font-body-sm text-xs flex items-center gap-1.5 mt-1">
                        <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">location_on</span>
                        Community Centre, Sector-C, Vasant Vihar, New Delhi - 110057
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-low text-primary font-label-sm text-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        Open 24x7 Active
                      </span>
                      <span className="block text-secondary font-label-sm text-xs mt-1">Distance: 0.8 km</span>
                    </div>
                  </div>

                  {/* Officers & Contact Personnel Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-container-low/70 p-4 rounded-lg border border-outline-variant/50 text-xs">
                    {/* Station House Officer */}
                    <div className="space-y-1">
                      <span className="text-secondary font-label-sm text-[11px] uppercase tracking-wider block font-semibold">
                        Station House Officer (SHO)
                      </span>
                      <p className="font-title-md text-xs font-bold text-primary flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[18px]">badge</span>
                        Insp. Rajesh K. Sharma
                      </p>
                      <div className="text-on-surface-variant font-body-sm text-xs space-y-0.5 pt-0.5">
                        <p className="text-secondary">Duty Shift: <span className="text-primary font-medium">General / Day Roster</span></p>
                        <p className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-secondary">phone</span>
                          <a className="text-primary font-semibold hover:underline" href="tel:+911126154100">+91 11-26154100</a>
                        </p>
                      </div>
                    </div>

                    {/* Women Civic Desk */}
                    <div className="space-y-1 md:border-l md:border-outline-variant/60 md:pl-4">
                      <span className="text-secondary font-label-sm text-[11px] uppercase tracking-wider block font-semibold">
                        Women Civic Help Desk Officer
                      </span>
                      <p className="font-title-md text-xs font-bold text-primary flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[18px]">support_agent</span>
                        Sub-Insp. Anjali Mehra
                      </p>
                      <div className="text-on-surface-variant font-body-sm text-xs space-y-0.5 pt-0.5">
                        <p className="text-secondary">Desk Hours: <span className="text-primary font-medium">Dedicated 24x7</span></p>
                        <p className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-secondary">phone</span>
                          <a className="text-primary font-semibold hover:underline" href="tel:+911126154108">+91 11-26154108</a>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Jurisdiction Boundaries Coverage */}
                  <div>
                    <span className="text-secondary font-label-sm text-xs uppercase tracking-wider block mb-1.5 font-semibold">
                      Territorial Jurisdictional Coverage:
                    </span>
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      {['Vasant Vihar', 'Basant Lok', 'Munirka Enclave', 'Priya Complex Commercial Zone', 'Sector C & D DDA Pockets'].map((area) => (
                        <span key={area} className="px-2.5 py-1 bg-surface-container text-primary font-label-md text-xs rounded border border-outline-variant/40">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Station Facilities Checklist */}
                  <div>
                    <span className="text-secondary font-label-sm text-xs uppercase tracking-wider block mb-1.5 font-semibold">
                      Available Civic Amenities &amp; Infrastructure:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-on-surface font-body-sm text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-emerald-700">check_circle</span>
                        <span>24x7 Citizen Desk</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-emerald-700">check_circle</span>
                        <span>Cyber Help Desk</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-emerald-700">check_circle</span>
                        <span>Child-Friendly Room</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-emerald-700">check_circle</span>
                        <span>Zero-FIR Kiosk</span>
                      </div>
                    </div>
                  </div>

                  {/* Station Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-outline-variant/60">
                    <Link 
                      to="/file-complaint"
                      className="px-5 py-2.5 bg-primary-container text-white rounded font-label-lg text-xs font-semibold hover:bg-primary transition-colors flex items-center gap-1.5 shadow-sm active:scale-[0.99]"
                    >
                      <span className="material-symbols-outlined text-[18px]">post_add</span>
                      File e-FIR for this Station
                    </Link>
                    <a 
                      href="tel:+911126154100"
                      className="px-4 py-2.5 bg-surface-container-lowest text-primary border border-outline-variant rounded font-label-lg text-xs font-semibold hover:bg-surface-container-low transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">call</span>
                      Call Station
                    </a>
                    <button 
                      type="button"
                      onClick={() => alert('GPS Navigation initiated: Route to Vasant Vihar PS (0.8 km via Poorvi Marg).')}
                      className="px-4 py-2.5 bg-surface-container-lowest text-secondary hover:text-primary border border-outline-variant rounded font-label-lg text-xs font-medium hover:bg-surface-container-low transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">directions</span>
                      Get Directions
                    </button>
                  </div>
                </div>
              </article>

              {/* 2. NEARBY ALTERNATE STATION CARD */}
              <article className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 hover:border-primary-container/60 transition-all shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-surface-container text-secondary rounded font-label-sm text-xs font-semibold uppercase">
                        Contiguous Jurisdiction
                      </span>
                      <span className="text-secondary font-label-sm text-xs font-mono">Code: PS-05</span>
                    </div>
                    <h3 className="font-headline-sm text-base font-bold text-primary">
                      R.K. Puram Police Station
                    </h3>
                    <p className="text-secondary font-body-sm text-xs flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[15px]">pin_drop</span>
                      Sector 12, R.K. Puram, New Delhi - 110022 (Approx. 2.4 km away)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-secondary font-body-sm text-xs block">Duty Officer Desk:</span>
                    <span className="font-title-md text-xs font-bold text-primary">+91 11-26177178</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-outline-variant/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-secondary">
                    SHO: <strong className="text-on-surface">Insp. Vikramaditya Sen</strong> | Sectors 1-6 &amp; Ring Road Corridor
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={() => alert('Viewing Sector 1-6 beat boundaries.')}
                      className="px-3 py-1.5 bg-surface-container-low hover:bg-surface-container text-primary font-label-md text-xs rounded border border-outline-variant cursor-pointer"
                    >
                      View Territorial Map
                    </button>
                    <Link 
                      to="/file-complaint"
                      className="px-3 py-1.5 bg-primary-container text-white font-label-md text-xs rounded hover:bg-primary font-semibold"
                    >
                      Select Station
                    </Link>
                  </div>
                </div>
              </article>

              {/* 3. SPECIALIZED POLICE STATION CARD */}
              <article className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 hover:border-primary-container/60 transition-all shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded font-label-sm text-xs font-semibold uppercase">
                        Specialized Unit
                      </span>
                      <span className="text-secondary font-label-sm text-xs font-mono">Code: PS-CYB-SW</span>
                    </div>
                    <h3 className="font-headline-sm text-base font-bold text-primary">
                      District Cyber Crime Police Station (South West)
                    </h3>
                    <p className="text-secondary font-body-sm text-xs flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[15px]">security</span>
                      Dedicated Command Cell for Internet &amp; Financial Wire Fraud Redressal
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-secondary font-body-sm text-xs block">Direct Cyber Hotline:</span>
                    <span className="font-title-md text-xs font-bold text-primary">1930 / +91 11-20892911</span>
                  </div>
                </div>
              </article>
            </div>

            {/* RIGHT COLUMN: Jurisdiction Verification Map & Legal Guarantee (5 Columns) */}
            <aside className="lg:col-span-5 space-y-6">
              
              {/* Jurisdiction Verification Box */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">map</span>
                    <h3 className="font-title-md text-sm font-bold text-primary">Territorial Beat Map</h3>
                  </div>
                  <span className="text-xs font-mono bg-surface-container px-2 py-0.5 rounded text-primary font-bold">BEAT-03</span>
                </div>

                {/* Map Graphic Preview */}
                <div className="w-full h-56 bg-surface-container-high rounded-lg border border-outline-variant relative overflow-hidden flex flex-col justify-between p-3">
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#14213d_1px,transparent_1px)] [background-size:10px_10px]"></div>
                  
                  {/* Mock Beat Pins */}
                  <div className="relative z-10 flex justify-between">
                    <span className="px-2 py-1 rounded bg-surface-container-lowest/90 text-primary font-mono text-[10px] font-bold shadow-xs">
                      Sector-C Gate 1
                    </span>
                    <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold shadow-xs">
                      ● Active Patrol
                    </span>
                  </div>

                  <div className="relative z-10 bg-surface-container-lowest/95 backdrop-blur-sm p-2.5 rounded border border-outline-variant/60 shadow-sm text-xs">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-primary">
                      <span>Beat Officer: HC Manoj Kumar</span>
                      <span className="font-mono text-emerald-700">On Duty</span>
                    </div>
                    <p className="text-[10px] text-secondary mt-0.5">Mobile Patrol Van SW-14 • Contact: +91 98110 44291</p>
                  </div>
                </div>

                <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/60 text-xs text-secondary space-y-1">
                  <p className="font-semibold text-primary">Facing Confusion Regarding Jurisdiction?</p>
                  <p className="leading-relaxed">Call the Delhi Police Central Jurisdictional Helpdesk at <strong>011-23469112</strong> for immediate station routing.</p>
                </div>
              </div>

              {/* Zero-FIR Guarantee Legal Mandate Card */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-3.5 relative overflow-hidden">
                <div className="h-1 bg-tertiary-fixed-dim absolute top-0 left-0 w-full"></div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">gavel</span>
                  <h3 className="font-title-md text-sm font-bold text-primary">Statutory Zero-FIR Mandate</h3>
                </div>
                <p className="font-body-sm text-xs text-secondary leading-relaxed">
                  Under <strong>Section 173(1) of the Bharatiya Nagarik Suraksha Sanhita (BNSS)</strong> and Supreme Court directives in <em>Lalita Kumari vs. Govt of U.P.</em>, a police officer is statutorily obligated to register an FIR irrespective of territorial jurisdiction if a cognizable incident is reported.
                </p>
                <div className="p-3 rounded bg-surface-container-low text-xs border border-outline-variant/50 space-y-1">
                  <span className="font-bold text-primary block">Your Legal Protection:</span>
                  <span className="text-secondary block">No station can refuse complaint intake citing jurisdiction. The docket will be registered as a Zero-FIR and transferred electronically.</span>
                </div>
              </div>

            </aside>

          </div>

        </main>
      </div>
    </div>
  );
}

export default JurisdictionPage;
