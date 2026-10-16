import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/HomePage';
import HowItWorksPage from './pages/HowItWorksPage';
import FirJourneyPage from './pages/FirJourneyPage';
import ServicesPage from './pages/ServicesPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import FileComplaintPage from './pages/FileComplaintPage';
import LiveTrackingPage from './pages/LiveTrackingPage';
import JurisdictionPage from './pages/JurisdictionPage';
import ProfilePage from './pages/ProfilePage';
import EvidenceVaultPage from './pages/EvidenceVaultPage';
import CourtNoticesPage from './pages/CourtNoticesPage';
import DeskAppointmentsPage from './pages/DeskAppointmentsPage';
import SupervisoryGrievancePage from './pages/SupervisoryGrievancePage';
import NotFoundPage from './pages/NotFoundPage';

export function App() {
  return (
    <AuthProvider>
      <Router>
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
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
