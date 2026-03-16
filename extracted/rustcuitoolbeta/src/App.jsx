import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PlanProvider } from './context/PlanContext';
import { ModalProvider } from './context/ModalContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import HomePage from './components/HomePage';
import Auth from './components/Auth';
import ErrorPage from './components/ErrorPage';
import StatusTracker from './components/StatusTracker';
import OfflineIndicator from './components/OfflineIndicator';
import { initSecurity, disableSecurity } from './utils/security';
import { useAuth } from './context/AuthContext';
import './App.css';
import './components/PageTransition.css';
import './components/MobileResponsive.css';

// Lazy-loaded routes (code-split for faster initial load)
const Dashboard = lazy(() => import('./components/Dashboard'));
const Editor = lazy(() => import('./components/Editor'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const AdminRoute = lazy(() => import('./components/AdminRoute'));
const OnboardingRoute = lazy(() => import('./components/OnboardingRoute'));
const ShareView = lazy(() => import('./components/ShareView'));
const PlansPage = lazy(() => import('./components/PlansPage'));
const LegalPage = lazy(() => import('./components/LegalPage'));
const DesktopAuthCallback = lazy(() => import('./components/DesktopAuthCallback'));

function AppInner() {
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin) {
      disableSecurity();
    } else {
      initSecurity();
    }
  }, [isAdmin]);

  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '_')) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <>
      <PlanProvider>
      <NotificationProvider>
      <ToastProvider>
        <Router basename="/">
        <ModalProvider>
          <StatusTracker />
          <OfflineIndicator />
          <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#1e1e1e',color:'#fff'}}>Loading...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/desktop-callback" element={<DesktopAuthCallback />} />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/dashboard" element={
              <OnboardingRoute>
                <Dashboard />
              </OnboardingRoute>
            } />
            <Route path="/editor/:projectId" element={
              <OnboardingRoute>
                <Editor />
              </OnboardingRoute>
            } />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/legal/:type" element={<LegalPage />} />
            <Route path="/share/:projectId" element={<ShareView />} />
            <Route path="/error/:code" element={<ErrorPage />} />
            <Route path="*" element={<ErrorPage />} />
          </Routes>
          </Suspense>
        </ModalProvider>
        </Router>
      </ToastProvider>
      </NotificationProvider>
      </PlanProvider>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
