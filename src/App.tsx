import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ContentProvider } from './contexts/ContentContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AdminRoute from './components/auth/AdminRoute';
import SuperAdminRoute from './components/routes/SuperAdminRoute';
import EditorRoute from './components/routes/EditorRoute';
import ConsentBanner from './components/legal/ConsentBanner';
import ScrollToTop from './components/ScrollToTop';
import React, { useEffect, useState } from 'react';
import UserStatusModal from './components/auth/UserStatusModal';
import { AlertTriangle, X, CheckCircle } from 'lucide-react';

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
import AdminChatInterface from './pages/admin/AdminChatInterface';
// FutureFeatures n'est plus utilisé mais conservé pour référence
// import FutureFeatures from './pages/admin/FutureFeatures';
import TestFirebase from './pages/TestFirebase';
import FeedbackAdmin from './pages/admin/FeedbackAdmin';
import AdminWebinarManager from './pages/admin/AdminWebinarManager';
import AdminWorkshopProposals from './pages/admin/AdminWorkshopProposals';
import AdminEmailBroadcast from './components/AdminEmailBroadcast';
import NotFound from './pages/NotFound';
import UserProfile from './pages/UserProfile';
import UserTutorial from './pages/UserTutorial';
import Help from './pages/Help';
import ChatAI from './pages/ChatAI';
import ResetPassword from './pages/ResetPassword';
import Feedback from './pages/Feedback';
import EditorDashboard from './pages/editor/EditorDashboard';
import ApplicationsDashboard from './pages/ApplicationsDashboard';
import Webinars from './pages/Webinars';
import WebinarDetail from './pages/WebinarDetail';
import ProposerAtelier from './pages/ProposerAtelier';
import MesPropositions from './pages/MesPropositions';
import UserChat from './pages/UserChat';

// Pages légales
import CGU from './pages/legal/CGU';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import LegalNotice from './pages/legal/LegalNotice';
import ModerationCharter from './pages/legal/ModerationCharter';
import RGPDRegistry from './pages/legal/RGPDRegistry';

// Composant pour la modale de bienvenue
const WelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const { currentUser } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (currentUser) {
      // Vérifier si l'utilisateur a déjà vu le message aujourd'hui
      const lastSeen = localStorage.getItem(`disclaimerSeen_${currentUser.uid}`);
      const today = new Date().toDateString();
      
      if (!lastSeen || new Date(lastSeen).toDateString() !== today) {
        setIsOpen(true);
      }
    }
  }, [currentUser, location.pathname]);

  const handleAccept = () => {
    if (currentUser) {
      localStorage.setItem(`disclaimerSeen_${currentUser.uid}`, new Date().toISOString());
      setHasAccepted(true);
      setIsOpen(false);
    }
  };

  if (!isOpen || hasAccepted) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Information importante</h2>
            </div>
            <button
              onClick={handleAccept}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="prose prose-lg text-gray-700 space-y-4">
            <p>
              <strong>Bienvenue sur ESIG-prep-guide !</strong> Avant de commencer, il est important de noter que :
            </p>
            
            <ul className="list-disc pl-5 space-y-2">
              <li>Cette application <strong>ne garantit pas</strong> l'obtention d'un visa</li>
              <li>Les informations fournies sont basées sur des expériences personnelles</li>
              <li>Les procédures peuvent évoluer - restez informé des mises à jour officielles</li>
              <li>Nous vous recommandons de toujours vérifier les informations auprès des sources officielles</li>
            </ul>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    En utilisant cette application, vous reconnaissez avoir pris connaissance de ces informations importantes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleAccept}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              J'ai compris, continuer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant pour la bannière de rappel
const DisclaimerBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { currentUser } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsClient(true);
    // Vérifier si l'utilisateur a déjà fermé le bandeau pour cette session
    const bannerClosed = sessionStorage.getItem('bannerClosed');
    if (bannerClosed === 'true') {
      setIsVisible(false);
    }
  }, [location.pathname]);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('bannerClosed', 'true');
  };

  if (!isClient || !currentUser || !isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 max-w-xs rounded-lg shadow-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-yellow-700">
              <span className="font-medium">Rappel :</span> Cette application fournit des conseils basés sur des expériences personnelles et ne garantit pas l'obtention d'un visa.
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className="text-yellow-500 hover:text-yellow-700 focus:outline-none"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant pour envelopper les routes protégées
const ProtectedContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <WelcomeModal />
      <UserStatusModal />
      {children}
      <DisclaimerBanner />
    </>
  );
};

// Composant pour gérer l'authentification
const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <ProtectedContent>{children}</ProtectedContent>;
};

// Composant pour rediriger vers le dashboard si déjà authentifié
const RedirectIfAuthenticated = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};



// Composant principal de l'application
function App() {
  return (
    <AuthProvider>
      <ContentProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<RedirectIfAuthenticated><Login /></RedirectIfAuthenticated>} />
                <Route path="/register" element={<RedirectIfAuthenticated><Register /></RedirectIfAuthenticated>} />
                <Route path="/reset-password" element={<RedirectIfAuthenticated><ResetPassword /></RedirectIfAuthenticated>} />
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
                  <AuthWrapper>
                    <Dashboard />
                  </AuthWrapper>
                } />
                <Route path="/applications" element={
                  <AuthWrapper>
                    <ApplicationsDashboard />
                  </AuthWrapper>
                } />
                <Route path="/resources" element={
                  <AuthWrapper>
                    <ResourceLibrary />
                  </AuthWrapper>
                } />
                <Route path="/faq" element={
                  <AuthWrapper>
                    <FAQ />
                  </AuthWrapper>
                } />
                <Route path="/feedback" element={
                  <AuthWrapper>
                    <Feedback />
                  </AuthWrapper>
                } />
                
                {/* Forum Routes - Accessible à tous les utilisateurs authentifiés */}
                <Route path="/forum" element={
                  <AuthWrapper>
                    <Forum />
                  </AuthWrapper>
                } />
                <Route path="/forum/category/:categoryId" element={
                  <AuthWrapper>
                    <Forum />
                  </AuthWrapper>
                } />
                <Route path="/forum/thread/:threadId" element={
                  <AuthWrapper>
                    <ThreadView />
                  </AuthWrapper>
                } />
                <Route path="/forum/new-thread" element={
                  <AuthWrapper>
                    <NewThread />
                  </AuthWrapper>
                } />
                <Route path="/profile" element={
                  <AuthWrapper>
                    <UserProfile />
                  </AuthWrapper>
                } />
                <Route path="/tutorial" element={
                  <AuthWrapper>
                    <UserTutorial />
                  </AuthWrapper>
                } />
                <Route path="/help" element={
                  <AuthWrapper>
                    <Help />
                  </AuthWrapper>
                } />
                <Route path="/chat-ai" element={
                  <AuthWrapper>
                    <SuperAdminRoute>
                      <ChatAI />
                    </SuperAdminRoute>
                  </AuthWrapper>
                } />
                <Route path="/user-chat" element={
                  <AuthWrapper>
                    <UserChat />
                  </AuthWrapper>
                } />
                
                {/* Admin Routes */}
                <Route path="/admin" element={
                  <AuthWrapper>
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  </AuthWrapper>
                } />
                <Route path="/admin/content" element={
                  <AuthWrapper>
                    <AdminRoute>
                      <AdminContentEditor />
                    </AdminRoute>
                  </AuthWrapper>
                } />
                <Route path="/admin/resources" element={
                  <AuthWrapper>
                    <AdminRoute>
                      <AdminResourceManager />
                    </AdminRoute>
                  </AuthWrapper>
                } />
                <Route path="/admin/users" element={
                  <AuthWrapper>
                    <AdminRoute>
                      <AdminUserManager />
                    </AdminRoute>
                  </AuthWrapper>
                } />
                <Route path="/admin/users/:uid" element={
                  <AuthWrapper>
                    <AdminRoute>
                      <AdminUserProfile />
                    </AdminRoute>
                  </AuthWrapper>
                } />
                <Route path="/admin/activity" element={
                  <AuthWrapper>
                    <AdminRoute>
                      <AdminActivityLogPage />
                    </AdminRoute>
                  </AuthWrapper>
                } />
                <Route path="/admin/progressions" element={
                  <AuthWrapper>
                    <AdminRoute>
                      <AdminProgressionOverview />
                    </AdminRoute>
                  </AuthWrapper>
                } />
                <Route path="/admin/tutorial" element={
                  <AuthWrapper>
                    <AdminRoute>
                      <AdminTutorial />
                    </AdminRoute>
                  </AuthWrapper>
                } />
                <Route path="/admin/dropbox" element={
                  <AuthWrapper>
                    <AdminRoute>
                      <AdminDropboxManager />
                    </AdminRoute>
                  </AuthWrapper>
                } />
                <Route path="/admin/feedbacks" element={
                  <AuthWrapper>
                    <AdminRoute>
                      <FeedbackAdmin />
                    </AdminRoute>
                  </AuthWrapper>
                } />
                <Route path="/admin/webinars" element={
                  <AuthWrapper>
                    <AdminRoute>
                      <AdminWebinarManager />
                    </AdminRoute>
                  </AuthWrapper>
                } />
                <Route path="/admin/workshop-proposals" element={
                  <AuthWrapper>
                    <AdminRoute>
                      <AdminWorkshopProposals />
                    </AdminRoute>
                  </AuthWrapper>
                } />
                <Route path="/admin/email-broadcast" element={
                  <AuthWrapper>
                    <SuperAdminRoute>
                      <AdminEmailBroadcast />
                    </SuperAdminRoute>
                  </AuthWrapper>
                } />
                <Route path="/admin/chat-interface" element={
                  <AuthWrapper>
                    <SuperAdminRoute>
                      <AdminChatInterface />
                    </SuperAdminRoute>
                  </AuthWrapper>
                } />
                
                {/* Editor Routes */}
                <Route path="/editor" element={
                  <AuthWrapper>
                    <EditorRoute>
                      <EditorDashboard />
                    </EditorRoute>
                  </AuthWrapper>
                } />
                <Route path="/editor/content" element={
                  <AuthWrapper>
                    <EditorRoute>
                      <AdminContentEditor />
                    </EditorRoute>
                  </AuthWrapper>
                } />
                <Route path="/editor/resources" element={
                  <AuthWrapper>
                    <EditorRoute>
                      <AdminResourceManager />
                    </EditorRoute>
                  </AuthWrapper>
                } />
                <Route path="/editor/faq" element={
                  <AuthWrapper>
                    <EditorRoute>
                      <AdminContentEditor />
                    </EditorRoute>
                  </AuthWrapper>
                } />
                <Route path="/editor/forum" element={
                  <AuthWrapper>
                    <EditorRoute>
                      <Forum />
                    </EditorRoute>
                  </AuthWrapper>
                } />
                <Route path="/editor/dashboard" element={
                  <AuthWrapper>
                    <EditorRoute>
                      <AdminDashboard />
                    </EditorRoute>
                  </AuthWrapper>
                } />
                <Route path="/editor/feedbacks" element={
                  <AuthWrapper>
                    <EditorRoute>
                      <FeedbackAdmin />
                    </EditorRoute>
                  </AuthWrapper>
                } />
                <Route path="/editor/dropbox" element={
                  <AuthWrapper>
                    <EditorRoute>
                      <AdminDropboxManager />
                    </EditorRoute>
                  </AuthWrapper>
                } />
                <Route path="/editor/webinars" element={
                  <AuthWrapper>
                    <EditorRoute>
                      <AdminWebinarManager />
                    </EditorRoute>
                  </AuthWrapper>
                } />
                <Route path="/editor/workshop-proposals" element={
                  <AuthWrapper>
                    <EditorRoute>
                      <AdminWorkshopProposals />
                    </EditorRoute>
                  </AuthWrapper>
                } />
                
                {/* Webinars */}
                <Route path="/webinars" element={
                  <AuthWrapper>
                    <Webinars />
                  </AuthWrapper>
                } />
                <Route path="/webinars/:id" element={
                  <AuthWrapper>
                    <WebinarDetail />
                  </AuthWrapper>
                } />
                <Route path="/proposer-atelier" element={
                  <AuthWrapper>
                    <ProposerAtelier />
                  </AuthWrapper>
                } />
                <Route path="/mes-propositions" element={
                  <AuthWrapper>
                    <MesPropositions />
                  </AuthWrapper>
                } />
                {/* <Route path="/webinars/:id/confirmation" element={<WebinarConfirmation />} /> */}

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