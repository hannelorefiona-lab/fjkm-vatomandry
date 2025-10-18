import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  UsersRound, 
  BarChart3, 
  Settings,
  Cross,
  LogOut,
  User,
  DollarSign,
  Church
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const navigationItems = [
  {
    title: "Tableau de bord",
    url: "/dashboard",
    icon: LayoutDashboard,
    requiredRoles: ['all']
  },
  {
    title: "Adhérents", 
    url: "/adherents",
    icon: Users,
    requiredRoles: ['ADMIN', 'RESPONSABLE', 'SECRETAIRE']
  },
  {
    title: "Mpandray",
    url: "/mpandray",
    icon: Church,
    requiredRoles: ['ADMIN', 'RESPONSABLE', 'TRESORIER']
  },
  {
    title: "Groupes",
    url: "/groupes", 
    icon: UsersRound,
    requiredRoles: ['ADMIN', 'RESPONSABLE', 'SECRETAIRE']
  },
  {
    title: "Finances",
    url: "/finances",
    icon: DollarSign,
    requiredRoles: ['ADMIN', 'RESPONSABLE', 'TRESORIER']
  },
  {
    title: "Statistiques",
    url: "/statistiques",
    icon: BarChart3,
    requiredRoles: ['all']
  }
];

const memberItems = [
  {
    title: "Mon Profil",
    url: "/profil",
    icon: User
  }
];

const adminItems = [
  {
    title: "Administration",
    url: "/admin",
    icon: Settings
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut, userRole, user, isAdmin, hasRole } = useAuth();
  const currentPath = location.pathname;
  
  const isCollapsed = state === "collapsed";
  const canManageAdherents = hasRole('ADMIN') || hasRole('RESPONSABLE') || hasRole('SECRETAIRE');
  const canViewFinances = hasRole('ADMIN') || hasRole('RESPONSABLE') || hasRole('TRESORIER');

  const isActive = (path: string) => currentPath === path;
  const getNavClass = (active: boolean) => 
    active 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  return (
    <Sidebar
      className="bg-sidebar border-sidebar-border transition-smooth"
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Cross className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-sidebar-foreground">FJKM</h2>
              <p className="text-xs text-sidebar-foreground/70">Vatomandry</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            {!isCollapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems
                .filter(item => {
                  if (item.requiredRoles.includes('all')) return true;
                  return item.requiredRoles.some(role => hasRole(role));
                })
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={getNavClass(isActive(item.url))}
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Section Membre */}
        {userRole === 'MEMBRE' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/60">
              {!isCollapsed && "Espace Membre"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {memberItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={getNavClass(isActive(item.url))}
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {(isAdmin) && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/60">
              {!isCollapsed && "Administration"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={getNavClass(isActive(item.url))}
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        {!isCollapsed && (
          <div className="mb-2 px-2">
            <div className="flex items-center gap-2 text-sm text-sidebar-foreground/70">
              <User className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium text-sidebar-foreground">{user?.email}</span>
                <span className="text-xs">{userRole}</span>
              </div>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Déconnexion</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}