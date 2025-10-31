import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy-load pages for code-splitting
const GoalList = lazy(() => import('./pages/GoalList'));
const CreateGoal = lazy(() => import('./pages/CreateGoal'));
const MonthlySummary = lazy(() => import('./pages/MonthlySummary'));

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
            <Route path="/" element={<GoalList />} />
            <Route path="/new" element={<CreateGoal />} />
            <Route path="/summary" element={<MonthlySummary />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App
