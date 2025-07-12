import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Container } from 'react-bootstrap';

// Components
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import BrowseUsers from './pages/BrowseUsers';
import UserProfile from './pages/UserProfile';
import MySwaps from './pages/MySwaps';
import AdminDashboard from './pages/AdminDashboard';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Admin Components
import AdminUsers from './pages/admin/AdminUsers';
import AdminSwaps from './pages/admin/AdminSwaps';
import AdminStats from './pages/admin/AdminStats';
import AdminMessages from './pages/admin/AdminMessages';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Navbar />
        <Container fluid className="px-0">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/browse" element={<BrowseUsers />} />
            <Route path="/user/:id" element={<UserProfile />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/my-swaps" element={
              <ProtectedRoute>
                <MySwaps />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            } />
            <Route path="/admin/swaps" element={
              <AdminRoute>
                <AdminSwaps />
              </AdminRoute>
            } />
            <Route path="/admin/stats" element={
              <AdminRoute>
                <AdminStats />
              </AdminRoute>
            } />
            <Route path="/admin/messages" element={
              <AdminRoute>
                <AdminMessages />
              </AdminRoute>
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
      </div>
    </AuthProvider>
  );
}

export default App; 