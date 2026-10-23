import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PageLoader from './components/ui/PageLoader';

// Lazy-loaded pages for fast code-splitting and minimal initial bundle size
const HomePage = lazy(() => import('./pages/HomePage'));
const FirJourneyPage = lazy(() => import('./pages/FirJourneyPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const FileComplaintPage = lazy(() => import('./pages/FileComplaintPage'));
const LiveTrackingPage = lazy(() => import('./pages/LiveTrackingPage'));
const JurisdictionPage = lazy(() => import('./pages/JurisdictionPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const EvidenceVaultPage = lazy(() => import('./pages/EvidenceVaultPage'));
const CourtNoticesPage = lazy(() => import('./pages/CourtNoticesPage'));
const DeskAppointmentsPage = lazy(() => import('./pages/DeskAppointmentsPage'));
const SupervisoryGrievancePage = lazy(() => import('./pages/SupervisoryGrievancePage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader text="Loading CaseSync Platform..." />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/how-it-works" element={<FirJourneyPage />} />
            <Route path="/fir-journey" element={<FirJourneyPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/file-complaint" element={<FileComplaintPage />} />
            <Route path="/file-fir" element={<FileComplaintPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/live-tracking" element={<LiveTrackingPage />} />
            <Route path="/live-tracking" element={<LiveTrackingPage />} />
            <Route path="/track" element={<LiveTrackingPage />} />
            <Route path="/dashboard/jurisdiction" element={<JurisdictionPage />} />
            <Route path="/jurisdiction" element={<JurisdictionPage />} />
            <Route path="/dashboard/profile" element={<ProfilePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/dashboard/evidence" element={<EvidenceVaultPage />} />
            <Route path="/evidence" element={<EvidenceVaultPage />} />
            <Route path="/dashboard/court-notices" element={<CourtNoticesPage />} />
            <Route path="/court-notices" element={<CourtNoticesPage />} />
            <Route path="/dashboard/summons" element={<CourtNoticesPage />} />
            <Route path="/dashboard/appointments" element={<DeskAppointmentsPage />} />
            <Route path="/appointments" element={<DeskAppointmentsPage />} />
            <Route path="/dashboard/grievance" element={<SupervisoryGrievancePage />} />
            <Route path="/grievance" element={<SupervisoryGrievancePage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
