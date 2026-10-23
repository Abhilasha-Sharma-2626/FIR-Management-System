import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PageLoader from './components/ui/PageLoader';
import { ProtectedRoute, PublicOnlyRoute } from './components/auth/ProtectedRoute';

// Lazy-loaded pages for code-splitting & performance
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
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/how-it-works" element={<FirJourneyPage />} />
            <Route path="/fir-journey" element={<FirJourneyPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/live-tracking" element={<LiveTrackingPage />} />
            <Route path="/track" element={<LiveTrackingPage />} />
            <Route path="/dashboard/live-tracking" element={<LiveTrackingPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

            {/* Guest-Only Authentication Routes (Redirect to /dashboard if logged in) */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicOnlyRoute>
                  <SignupPage />
                </PublicOnlyRoute>
              }
            />

            {/* Protected Routes (Restricted with Sign In / Sign Up) */}
            <Route
              path="/file-complaint"
              element={
                <ProtectedRoute>
                  <FileComplaintPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/file-fir"
              element={
                <ProtectedRoute>
                  <FileComplaintPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/jurisdiction"
              element={
                <ProtectedRoute>
                  <JurisdictionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jurisdiction"
              element={
                <ProtectedRoute>
                  <JurisdictionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/evidence"
              element={
                <ProtectedRoute>
                  <EvidenceVaultPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/evidence"
              element={
                <ProtectedRoute>
                  <EvidenceVaultPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/court-notices"
              element={
                <ProtectedRoute>
                  <CourtNoticesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/court-notices"
              element={
                <ProtectedRoute>
                  <CourtNoticesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/summons"
              element={
                <ProtectedRoute>
                  <CourtNoticesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/appointments"
              element={
                <ProtectedRoute>
                  <DeskAppointmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <DeskAppointmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/grievance"
              element={
                <ProtectedRoute>
                  <SupervisoryGrievancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/grievance"
              element={
                <ProtectedRoute>
                  <SupervisoryGrievancePage />
                </ProtectedRoute>
              }
            />

            {/* Catch-All 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
