import React from 'react';import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ContentProvider } from './contexts/ContentContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ResourceLibrary from './pages/ResourceLibrary';
import FAQ from './pages/FAQ';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminContentEditor from './pages/admin/AdminContentEditor';
import AdminResourceManager from './pages/admin/AdminResourceManager';
import AdminUserManager from './pages/admin/AdminUserManager';
import AdminUserProfile from './pages/admin/AdminUserProfile';
import TestFirebase from './pages/TestFirebase';
import NotFound from './pages/NotFound';
import UserProfile from './pages/UserProfile';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <AuthProvider>
      <ContentProvider>
        <Router basename="/Esig-prep-guide">
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/test-firebase" element={<TestFirebase />} />
                
                {/* Protected Routes (require authentication) */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/resources" element={
                  <ProtectedRoute>
                    <ResourceLibrary />
                  </ProtectedRoute>
                } />
                <Route path="/faq" element={
                  <ProtectedRoute>
                    <FAQ />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } />
                
                {/* Admin Routes */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
                <Route path="/admin/content" element={
                  <AdminRoute>
                    <AdminContentEditor />
                  </AdminRoute>
                } />
                <Route path="/admin/resources" element={
                  <AdminRoute>
                    <AdminResourceManager />
                  </AdminRoute>
                } />
                <Route path="/admin/users" element={
                  <AdminRoute>
                    <AdminUserManager />
                  </AdminRoute>
                } />
                <Route path="/admin/users/:uid" element={
                  <AdminRoute>
                    <AdminUserProfile />
                  </AdminRoute>
                } />
                
                {/* 404 Page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </ContentProvider>
    </AuthProvider>
  );
}

export default App;