import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, History, User, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b border-border bg-card/5 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <Shield className="text-primary w-5 h-5" />
            <span className="hidden sm:inline">PhiShield <span className="text-primary">AI</span></span>
          </Link>

          {user && (
            <div className="hidden md:flex items-center gap-1">
              <NavLink to="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} active={isActive('/dashboard')}>Dashboard</NavLink>
              <NavLink to="/scan" icon={<Shield className="w-4 h-4" />} active={isActive('/scan')}>New Scan</NavLink>
              <NavLink to="/history" icon={<History className="w-4 h-4" />} active={isActive('/history')}>History</NavLink>
            </div>
          )}

          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            {user ? (
              <div className="flex items-center gap-1 md:gap-3">
                <Link to="/profile" className="flex items-center gap-2 hover:bg-muted p-1 pr-3 rounded-full transition-colors">
                  <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} className="w-8 h-8 rounded-full border border-border" alt="Profile" />
                  <span className="text-sm font-medium hidden lg:inline">{user.displayName}</span>
                </Link>
                <button 
                  onClick={async () => {
                    await logout();
                    window.location.href = '/';
                  }}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, icon, children, active }: { to: string, icon: React.ReactNode, children: React.ReactNode, active: boolean }) {
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
