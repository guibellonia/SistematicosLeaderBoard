import React, { useState } from 'react';
import { useAuth } from './auth-context';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Avatar, AvatarFallback } from './ui/avatar';

import { 
  Home, 
  User, 
  Settings, 
  Trophy, 
  Calendar,
  LogOut,
  Menu,
  Target
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'achievements', label: 'Conquistas', icon: Target },
  { id: 'seasons', label: 'Temporadas', icon: Calendar },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Target className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold">Sistemáticos</h2>
            <p className="text-sm text-muted-foreground">de Plantão</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={currentPage === item.id ? "default" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-4">
          <Avatar>
            <AvatarFallback>{user?.username?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate">{user?.username || 'Usuário'}</p>
            <p className="text-sm text-muted-foreground">{user?.points || 0} pontos</p>
          </div>
        </div>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-72 lg:bg-card lg:border-r lg:border-border">
        <SidebarContent />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          <span className="font-semibold">Sistemáticos</span>
        </div>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <div className="lg:pl-72">
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};