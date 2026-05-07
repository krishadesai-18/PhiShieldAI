import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, History, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Shield className="text-primary w-6 h-6" />
            <span>PhishShield <span className="text-primary">AI</span></span>
          </Link>

          {user && (
            <div className="hidden md:flex items-center gap-1">
              <NavLink to="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} active={isActive('/dashboard')}>Dashboard</NavLink>
              <NavLink to="/scan" icon={<Shield className="w-4 h-4" />} active={isActive('/scan')}>New Scan</NavLink>
              <NavLink to="/history" icon={<History className="w-4 h-4" />} active={isActive('/history')}>History</NavLink>
            </div>
          )}

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/profile" className="flex items-center gap-2 hover:bg-muted p-1 pr-3 rounded-full transition-colors">
                  <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} className="w-8 h-8 rounded-full border border-border" alt="Profile" />
                  <span className="text-sm font-medium hidden sm:inline">{user.displayName}</span>
                </Link>
                <button 
                  onClick={() => logout()}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all">
                Login
              </Link>
            )}
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
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
