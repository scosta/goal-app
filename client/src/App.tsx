import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy-load pages for code-splitting
const GoalList = lazy(() => import('./pages/GoalList'));
const CreateGoal = lazy(() => import('./pages/CreateGoal'));
const RecordProgress = lazy(() => import('./pages/RecordProgress'));
const MonthlySummary = lazy(() => import('./pages/MonthlySummary'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));

// Simple error boundary to catch runtime errors
class ErrorBoundary extends React.Component<React.PropsWithChildren, { hasError: boolean }> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // TODO: wire to telemetry later
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error', { error, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '16px' }}>
          <h2>Something went wrong.</h2>
          <p>Try refreshing the page.</p>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<div style={{ padding: '16px' }}>Loading...</div>}>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <GoalList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/new"
              element={
                <ProtectedRoute>
                  <CreateGoal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress"
              element={
                <ProtectedRoute>
                  <RecordProgress />
                </ProtectedRoute>
              }
            />
            <Route
              path="/summary"
              element={
                <ProtectedRoute>
                  <MonthlySummary />
                </ProtectedRoute>
              }
            />
            
            {/* Redirect unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App
