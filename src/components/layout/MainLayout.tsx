import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from './Header';
import Footer from './Footer';
import DisclaimerBanner from '../common/DisclaimerBanner';
import AuthWrapper from '../auth/AuthWrapper';
import dynamic from 'next/dynamic';

// Chargement dynamique pour éviter les problèmes de SSR avec le localStorage
const UserStatusModal = dynamic(
  () => import('../auth/UserStatusModal'),
  { ssr: false }
);

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title = 'ESIG-prep-guide',
  description = 'Guide de préparation pour les étudiants internationaux',
}) => {
  const router = useRouter();
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(router.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="flex-grow">
        {isAuthPage ? (
          <>{children}</>
        ) : (
          <AuthWrapper>
            {children}
            <UserStatusModal />
            <DisclaimerBanner />
          </AuthWrapper>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;
