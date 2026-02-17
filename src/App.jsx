import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Plan from './pages/Plan';
import Dashboard from './pages/Dashboard';
import ActiveWorkout from './pages/ActiveWorkout';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/workout" element={<ActiveWorkout />} />
          <Route path="/plan" element={<Layout><Plan /></Layout>} />
          <Route path="/profile" element={<Layout><div className="p-10 text-center text-slate-500">User Profile (Coming Soon)</div></Layout>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
