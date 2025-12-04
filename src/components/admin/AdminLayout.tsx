import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  Users,
  Calendar,
  CalendarDays,
  Trophy,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ellaRisesLogo from '@/assets/ella-rises-logo.png';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/participants', label: 'Participants', icon: Users },
  { href: '/admin/event-templates', label: 'Event Templates', icon: Calendar },
  { href: '/admin/events', label: 'Events', icon: CalendarDays },
  { href: '/admin/milestones', label: 'Milestone Titles', icon: Trophy },
  { href: '/admin/donations', label: 'Donations', icon: DollarSign },
];

const AdminLayout: React.FC = () => {
  const { admin, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/admin" className="flex items-center gap-2">
            <img src={ellaRisesLogo} alt="Ella Rises" className="h-8" />
            <span className="font-semibold text-sm">Admin</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-64 bg-background border-r transform transition-transform lg:translate-x-0 lg:static lg:inset-auto',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="hidden lg:flex items-center gap-2 px-6 h-16 border-b">
              <img src={ellaRisesLogo} alt="Ella Rises" className="h-10" />
              <span className="font-semibold">Admin</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User section */}
            <div className="p-4 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-medium truncate">{admin?.name}</p>
                  <p className="text-muted-foreground text-xs truncate">{admin?.email}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen lg:min-h-[calc(100vh)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
