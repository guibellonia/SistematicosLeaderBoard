import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './components/auth-context';
import { ThemeProvider } from './components/theme-context';
import { useSession } from './components/use-session';
import { Layout } from './components/layout';
import { LoginPage } from './components/login-page';
import { Dashboard } from './components/dashboard';
import { Leaderboard } from './components/leaderboard';
import { Profile } from './components/profile';
import { UserProfile } from './components/user-profile';
import { Toaster } from './components/ui/sonner';

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Inicializar verificação de sessão
  useSession();

  // Simular carregamento inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 bg-primary rounded-xl mx-auto animate-pulse"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  const handleNavigateToProfile = (username: string) => {
    setSelectedUser(username);
    setCurrentPage('user-profile');
  };

  const handleBackToOwnProfile = () => {
    setSelectedUser(null);
    setCurrentPage('profile');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigateToProfile={handleNavigateToProfile} />;
      case 'leaderboard':
        return <Leaderboard onNavigateToProfile={handleNavigateToProfile} />;
      case 'user-profile':
        return selectedUser ? <UserProfile targetUser={selectedUser} onBackToOwnProfile={handleBackToOwnProfile} onNavigateToProfile={handleNavigateToProfile} /> : <Dashboard onNavigateToProfile={handleNavigateToProfile} />;
      case 'profile':
        return <Profile section="profile" onNavigateToProfile={handleNavigateToProfile} />;
      case 'achievements':
        return <Profile section="achievements" onNavigateToProfile={handleNavigateToProfile} />;
      case 'seasons':
        return <Profile section="seasons" onNavigateToProfile={handleNavigateToProfile} />;
      case 'settings':
        return <Profile section="settings" onNavigateToProfile={handleNavigateToProfile} />;
      case 'status':
        return <Profile section="status" onNavigateToProfile={handleNavigateToProfile} />;
      default:
        return <Dashboard onNavigateToProfile={handleNavigateToProfile} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}