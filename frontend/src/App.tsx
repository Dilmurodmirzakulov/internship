import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationContainer } from './components/NotificationContainer';
import AppRoutes from './router/AppRoutes';
import { useAuthStore } from './store/authStore';
import './App.css';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <AppRoutes />
          <NotificationContainer />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
