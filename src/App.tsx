import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ContentProvider } from './contexts/ContentContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import SuperAdminRoute from './components/routes/SuperAdminRoute';
import ConsentBanner from './components/legal/ConsentBanner';
import ScrollToTop from './components/ScrollToTop';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ResourceLibrary from './pages/ResourceLibrary';
import FAQ from './pages/FAQ';
import Forum from './pages/Forum';
import ThreadView from './pages/ThreadView';
import NewThread from './pages/NewThread';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminContentEditor from './pages/admin/AdminContentEditor';
import AdminResourceManager from './pages/admin/AdminResourceManager';
import AdminUserManager from './pages/admin/AdminUserManager';
import AdminUserProfile from './pages/admin/AdminUserProfile';
import AdminActivityLogPage from './pages/admin/AdminActivityLog.tsx';
import AdminTutorial from './pages/admin/AdminTutorial';
import AdminProgressionOverview from './pages/admin/AdminProgressionOverview';
import AdminDropboxManager from './pages/admin/AdminDropboxManager';
import FutureFeatures from './pages/admin/FutureFeatures';
import TestFirebase from './pages/TestFirebase';
import NotFound from './pages/NotFound';
import UserProfile from './pages/UserProfile';
import UserTutorial from './pages/UserTutorial';
import Help from './pages/Help';
import ChatAI from './pages/ChatAI';
import ResetPassword from './pages/ResetPassword';

// Pages légales
import CGU from './pages/legal/CGU';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import LegalNotice from './pages/legal/LegalNotice';
import ModerationCharter from './pages/legal/ModerationCharter';
import RGPDRegistry from './pages/legal/RGPDRegistry';

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
                
                {/* Pages légales */}
                <Route path="/legal/cgu" element={<CGU />} />
                <Route path="/legal/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/legal/legal-notice" element={<LegalNotice />} />
                <Route path="/legal/moderation-charter" element={<ModerationCharter />} />
                <Route path="/legal/rgpd-registry" element={
                  <AdminRoute>
                    <RGPDRegistry />
                  </AdminRoute>
                } />
                
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
                
                {/* Forum Routes - Restreint au SuperAdmin uniquement */}
                <Route path="/forum" element={
                  <SuperAdminRoute>
                    <Forum />
                  </SuperAdminRoute>
                } />
                <Route path="/forum/category/:categoryId" element={
                  <SuperAdminRoute>
                    <Forum />
                  </SuperAdminRoute>
                } />
                <Route path="/forum/thread/:threadId" element={
                  <SuperAdminRoute>
                    <ThreadView />
                  </SuperAdminRoute>
                } />
                <Route path="/forum/new-thread" element={
                  <SuperAdminRoute>
                    <NewThread />
                  </SuperAdminRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } />
                <Route path="/tutorial" element={
                  <ProtectedRoute>
                    <UserTutorial />
                  </ProtectedRoute>
                } />
                <Route path="/help" element={
                  <ProtectedRoute>
                    <Help />
                  </ProtectedRoute>
                } />
                <Route path="/chat-ai" element={
                  <SuperAdminRoute>
                    <ChatAI />
                  </SuperAdminRoute>
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
                <Route path="/admin/activity" element={
                  <AdminRoute>
                    <AdminActivityLogPage />
                  </AdminRoute>
                } />
                <Route path="/admin/progressions" element={
                  <AdminRoute>
                    <AdminProgressionOverview />
                  </AdminRoute>
                } />
                <Route path="/admin/tutorial" element={
                  <AdminRoute>
                    <AdminTutorial />
                  </AdminRoute>
                } />
                <Route path="/admin/dropbox" element={
                  <AdminRoute>
                    <AdminDropboxManager />
                  </AdminRoute>
                } />
                <Route path="/admin/future-features" element={
                  <AdminRoute>
                    <FutureFeatures />
                  </AdminRoute>
                } />
                
                {/* 404 Page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            <ConsentBanner />
            <ScrollToTop />
          </div>
        </Router>
      </ContentProvider>
    </AuthProvider>
  );
}

export default App;