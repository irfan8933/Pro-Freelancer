import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Home, Wallet, User, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { Toaster } from 'react-hot-toast';

export function Layout() {
  const { profile } = useAuthStore();
  
  return (
    <div className="mx-auto max-w-md bg-slate-900 min-h-screen shadow-2xl relative pb-20 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full max-w-md mx-auto h-20 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 flex items-center justify-around z-50 px-4 pb-2">
        <NavItem to="/" icon="🏠" label="হোম" />
        <NavItem to="/wallet" icon="💳" label="ওয়ালেট" />
        <NavItem to="/profile" icon="👤" label="প্রোফাইল" />
        {profile?.role === 'admin' && (
          <NavItem to="/admin" icon="⚙️" label="এডমিন" />
        )}
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: string | React.ReactNode; label: string }) {
  const location = useLocation();
  // match exact or admin subroutes
  const isActive = to === '/' 
    ? location.pathname === '/' 
    : location.pathname.startsWith(to);

  return (
    <NavLink 
      to={to} 
      className={cn(
        "flex flex-col items-center gap-1 transition-all",
        isActive ? "text-indigo-400" : "text-slate-400"
      )}
    >
      <span className={cn("text-xl", isActive ? "text-indigo-400" : "text-slate-400")}>{icon}</span>
      <span className={cn("text-[10px]", isActive ? "text-indigo-400 font-medium" : "text-slate-500")}>{label}</span>
    </NavLink>
  );
}
