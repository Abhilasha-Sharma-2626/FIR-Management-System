import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  FileText, 
  PlusCircle, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  Building2, 
  BadgeCheck, 
  Home 
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export function DashboardPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Simple filing modal/state for citizen action
  const [showFilingModal, setShowFilingModal] = useState(false);
  const [complaintType, setComplaintType] = useState('THEFT');
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [description, setDescription] = useState('');
  const [filingStatus, setFilingStatus] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleComplaintSubmit = (e) => {
    e.preventDefault();
    const mockRef = `CMP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setFilingStatus({
      success: true,
      ref: mockRef,
      message: `Your complaint has been logged with Reference ID ${mockRef}. Station desk intake will verify territorial jurisdiction.`,
    });
    setTimeout(() => {
      setShowFilingModal(false);
      setFilingStatus(null);
      setIncidentLocation('');
      setDescription('');
    }, 2800);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-ivory text-ink flex flex-col justify-between antialiased">
        <Navbar />
        <main className="flex-1 max-w-md w-full mx-auto px-4 py-36 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-navy/5 text-navy flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-navy">
            Sign In Required
          </h1>
          <p className="text-xs sm:text-sm text-slate">
            The authenticated dashboard contains user-specific complaint records and case information. Please sign in to access your portal.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link to="/login">
              <Button variant="primary" size="md">
                Sign In
              </Button>
            </Link>
            <Link to="/">
              <Button variant="secondary" size="md">
                Return to Home
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const role = user?.role || 'CITIZEN';

  return (
    <div className="min-h-screen bg-ivory text-ink flex flex-col antialiased selection:bg-navy selection:text-ivory">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 lg:pt-32 lg:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Top Welcome Card */}
          <div className="bg-white rounded-2xl border border-borderSoft p-6 sm:p-8 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-navy text-white flex items-center justify-center font-display font-bold text-xl shadow-subtle">
                {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-xl sm:text-2xl font-bold text-navy">
                    {user?.fullName || user?.email}
                  </h1>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-navy/10 text-navy uppercase tracking-wider">
                    {role}
                  </span>
                </div>
                <p className="text-xs text-slate mt-0.5">
                  {user?.email} • User ID: {user?.userId || 'N/A'}{user?.phone ? ` • ${user.phone}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {role === 'CITIZEN' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowFilingModal(true)}
                  leftIcon={<PlusCircle className="w-4 h-4" />}
                >
                  File Complaint
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                leftIcon={<LogOut className="w-4 h-4 text-slate" />}
              >
                Sign Out
              </Button>
            </div>
          </div>

          {/* Role-Specific Officer Details Bar if Officer */}
          {(user?.officerId || user?.badgeNo) && (
            <div className="bg-navy text-white rounded-xl p-5 shadow-subtle flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <BadgeCheck className="w-5 h-5 text-saffron" />
                <div>
                  <span className="font-bold block text-sm">Official Police Station Duty Record</span>
                  <span className="text-slate-300">
                    Badge: {user?.badgeNo || 'N/A'} &bull; Rank: {user?.rank || 'Investigating Officer'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Building2 className="w-4 h-4 text-saffron" />
                <span>Station: {user?.stationName || 'Central District Headquarters (Station #1)'}</span>
              </div>
            </div>
          )}

          {/* Dashboard Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 8 Cols: Records / Filings Feed */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Active Filings */}
              <div className="bg-white rounded-2xl border border-borderSoft p-6 shadow-subtle">
                <div className="flex items-center justify-between pb-4 border-b border-borderSoft mb-4">
                  <div>
                    <h2 className="font-display text-base font-bold text-navy">
                      {role === 'CITIZEN' ? 'My Incident Filings' : 'Assigned Case Records'}
                    </h2>
                    <p className="text-xs text-slate">
                      {role === 'CITIZEN'
                        ? 'Reports submitted by your registered citizen identity'
                        : 'Official investigations assigned under your station jurisdiction'}
                    </p>
                  </div>
                  <span className="text-xs font-semibold bg-ivory px-2.5 py-1 rounded text-slate-muted border border-borderSoft">
                    1 Active Case
                  </span>
                </div>

                {/* Sample Verified Case Item */}
                <div className="p-4 rounded-xl bg-ivory border border-borderSoft space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-navy" />
                      <span className="font-mono text-sm font-bold text-navy">CMP-2026-8901</span>
                    </div>
                    <span className="text-[11px] font-bold text-orangeAccent bg-orangeAccent/10 px-2 py-0.5 rounded">
                      DESK REVIEW IN PROGRESS
                    </span>
                  </div>

                  <p className="text-xs text-slate">
                    <strong>Incident:</strong> Residential Trespass &amp; Property Theft &bull; Vasant Vihar Precinct
                  </p>

                  <div className="pt-2 border-t border-borderSoft/60 flex items-center justify-between text-[11px] text-slate-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate" /> Filed 14 Oct 2026, 21:50 IST
                    </span>
                    <span className="text-civicGreen font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Intake Token Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Notifications Feed */}
              <div className="bg-white rounded-2xl border border-borderSoft p-6 shadow-subtle">
                <h2 className="font-display text-base font-bold text-navy mb-4">
                  Recent Dispatches &amp; Audit Events
                </h2>
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-ivory border border-borderSoft flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-civicGreen mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-ink">Login Authenticated Successfully</p>
                      <p className="text-slate-muted text-[11px]">Audit event LOGIN_SUCCESS logged with client IP address.</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-ivory border border-borderSoft flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-orangeAccent mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-ink">Intake Verification Pending</p>
                      <p className="text-slate-muted text-[11px]">Station duty officer reviewing jurisdiction for CMP-2026-8901.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right 4 Cols: Quick Actions & Privacy Metadata */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Account Security Information */}
              <div className="bg-white rounded-2xl border border-borderSoft p-6 shadow-subtle space-y-4">
                <h3 className="font-display text-sm font-bold text-navy uppercase tracking-wider text-[11px]">
                  Account Privacy &amp; Security
                </h3>
                
                <div className="space-y-2.5 text-xs">
                  <div className="pb-2 border-b border-borderSoft flex justify-between">
                    <span className="text-slate">Data Minimization:</span>
                    <span className="font-medium text-civicGreen">PO7 Active</span>
                  </div>
                  <div className="pb-2 border-b border-borderSoft flex justify-between">
                    <span className="text-slate">Access Boundary:</span>
                    <span className="font-mono text-ink">{role}</span>
                  </div>
                  <div className="pb-2 border-b border-borderSoft flex justify-between">
                    <span className="text-slate">Audit Protection:</span>
                    <span className="font-medium text-ink">ACID Immutable</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link to="/" className="text-xs font-semibold text-navy hover:text-orangeAccent inline-flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5" /> Return to Public Portal
                  </Link>
                </div>
              </div>

              {/* Station Contact Note */}
              <div className="p-4 rounded-xl bg-ivory border border-borderSoft text-xs text-slate space-y-2">
                <span className="font-semibold text-navy block">Need Urgent Assistance?</span>
                <p className="leading-relaxed">
                  For immediate police response in India, dial <strong>112</strong>. CaseSync handles scheduled digital documentation and transparent status follow-ups.
                </p>
              </div>

            </div>

          </div>

        </div>
      </main>

      {/* Citizen Filing Modal */}
      {showFilingModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-borderSoft max-w-lg w-full p-6 sm:p-7 shadow-modal space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-borderSoft">
              <h3 className="font-display text-lg font-bold text-navy">
                File an Incident Report
              </h3>
              <button
                type="button"
                onClick={() => setShowFilingModal(false)}
                className="text-slate hover:text-navy text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            {filingStatus ? (
              <div className="p-4 rounded-xl bg-civicGreen/10 border border-civicGreen/20 text-xs text-civicGreen space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Submission Acknowledged
                </p>
                <p className="text-ink leading-relaxed">{filingStatus.message}</p>
              </div>
            ) : (
              <form onSubmit={handleComplaintSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-ink block mb-1">Incident Category</label>
                  <select
                    value={complaintType}
                    onChange={(e) => setComplaintType(e.target.value)}
                    className="w-full p-2 rounded-lg border border-borderSoft bg-ivory/50 text-ink focus:outline-none focus:border-navy"
                  >
                    <option value="THEFT">Theft / Burglary</option>
                    <option value="CYBER">Cybercrime / Financial Fraud</option>
                    <option value="HARASSMENT">Harassment / Public Nuisance</option>
                    <option value="LOST_PROPERTY">Lost Property / Document</option>
                    <option value="OTHER">Other Incident</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-ink block mb-1">Occurrence Date &amp; Approximate Time</label>
                  <input
                    type="datetime-local"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-borderSoft bg-ivory/50 text-ink focus:outline-none focus:border-navy"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-ink block mb-1">Incident Location / Landmark</label>
                  <input
                    type="text"
                    value={incidentLocation}
                    onChange={(e) => setIncidentLocation(e.target.value)}
                    placeholder="e.g. Near City Centre Metro, Sector 17"
                    className="w-full p-2 rounded-lg border border-borderSoft bg-ivory/50 text-ink focus:outline-none focus:border-navy"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-ink block mb-1">Brief Description of Incident</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a concise summary of what occurred..."
                    className="w-full p-2 rounded-lg border border-borderSoft bg-ivory/50 text-ink focus:outline-none focus:border-navy"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowFilingModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Submit Incident
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default DashboardPage;
