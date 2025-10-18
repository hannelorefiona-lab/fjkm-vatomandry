import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { NotificationSystem } from '@/components/NotificationSystem';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 md:h-16 border-b border-border bg-card flex items-center justify-between px-3 md:px-6 shadow-sm">
            <div className="flex items-center gap-2 md:gap-4">
              <SidebarTrigger />
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-semibold text-foreground">FJKM Vatomandry</h1>
                <p className="text-xs md:text-sm text-muted-foreground">Gestion des adhérents</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              <NotificationSystem />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}