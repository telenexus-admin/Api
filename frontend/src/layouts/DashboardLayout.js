import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  LayoutDashboard, 
  Server, 
  Key, 
  Webhook, 
  ScrollText,
  Code2,
  LogOut,
  User,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Overview', end: true },
    { to: '/dashboard/instances', icon: <Server className="w-5 h-5" />, label: 'Instances' },
    { to: '/dashboard/api-keys', icon: <Key className="w-5 h-5" />, label: 'API Keys' },
    { to: '/dashboard/webhooks', icon: <Webhook className="w-5 h-5" />, label: 'Webhooks' },
    { to: '/dashboard/logs', icon: <ScrollText className="w-5 h-5" />, label: 'Activity Logs' },
    { to: '/dashboard/playground', icon: <Code2 className="w-5 h-5" />, label: 'Playground' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#050505] border-r border-white/10 fixed h-full flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00FF94] rounded flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-black" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
              TELENEXUS
            </span>
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-white/5 transition-colors"
                data-testid="user-menu-trigger"
              >
                <div className="w-9 h-9 bg-[#121212] rounded-full flex items-center justify-center border border-white/10">
                  <User className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#121212] border-white/10">
              <DropdownMenuItem className="text-neutral-400">
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-[#FF5500] focus:text-[#FF5500]"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="glass-header border-b border-white/10 sticky top-0 z-40">
          <div className="px-8 py-4">
            <p className="text-sm text-neutral-500">
              Welcome back, <span className="text-neutral-300">{user?.name}</span>
            </p>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
