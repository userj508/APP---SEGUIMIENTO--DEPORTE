import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Plan from './pages/Plan';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ActiveWorkout from './pages/ActiveWorkout';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute><Layout><Home /></Layout></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/workout" element={<ProtectedRoute><ActiveWorkout /></ProtectedRoute>} />
          <Route path="/workout/:workoutId" element={<ProtectedRoute><ActiveWorkout /></ProtectedRoute>} />
          <Route path="/plan" element={<ProtectedRoute><Layout><Plan /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><div className="p-10 text-center text-slate-500">User Profile (Coming Soon)</div></Layout></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
