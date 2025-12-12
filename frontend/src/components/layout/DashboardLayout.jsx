import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Settings,
  BarChart3,
  Building2,
  Menu,
  X,
  Clock,
  LogOut,
  User,
  Briefcase,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../context/AuthContext';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { business, loading: businessLoading } = useBusiness();
  const { user, logout } = useAuth();

  // Redirect to setup if no business exists
  useEffect(() => {
    if (!businessLoading && !business) {
      navigate('/setup', { replace: true });
    }
  }, [business, businessLoading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Show loading while checking for business
  if (businessLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if no business
  if (!business) {
    return null;
  }

  const navigation = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: 'Appointments',
      href: '/dashboard/appointments',
      icon: Calendar,
    },
    {
      name: 'Services',
      href: '/dashboard/services',
      icon: Briefcase,
    },
    {
      name: 'Availability',
      href: '/dashboard/availability',
      icon: Clock,
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: BarChart3,
    },
    {
      name: 'Business Profile',
      href: '/dashboard/business',
      icon: Building2,
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ];

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.href;
    }
    return location.pathname.startsWith(item.href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo & Toggle */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {sidebarOpen && (
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Appointments</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(!sidebarOpen && 'mx-auto')}
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  !sidebarOpen && 'justify-center'
                )}
                title={!sidebarOpen ? item.name : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t p-4">
          <div
            className={cn(
              'flex items-center gap-3',
              !sidebarOpen && 'flex-col gap-2'
            )}
          >
            {sidebarOpen ? (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
                <Button variant="ghost" size="icon" title="Logout" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="icon" title="Logout" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-20'
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-card">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <h1 className="text-2xl font-bold">
                {navigation.find((item) => isActive(item))?.name || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Add notifications, quick actions, etc. here */}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
