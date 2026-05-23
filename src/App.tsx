import { useEffect, ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import { Layout } from './components/Layout';
import { Loader2 } from 'lucide-react';
import Auth from './pages/Auth';
import Home from './pages/Home';
import TaskDetail from './pages/TaskDetail';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTasks from './pages/admin/AdminTasks';
import AdminSubmissions from './pages/admin/AdminSubmissions';
import AdminFinances from './pages/admin/AdminFinances';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';

import History from './pages/History';

// Private Route logic
function RequireAuth({ children }: { children: ReactNode }) {
  const { user, profile, isLoading } = useAuthStore();
  
  if (isLoading) return <LoadingScreen />;
  if (!user || !profile) return <Navigate to="/auth" replace />;
  if (profile.is_banned) return <BannedScreen />;
  
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, profile, isLoading } = useAuthStore();
  
  if (isLoading) return <LoadingScreen />;
  if (!user || !profile) return <Navigate to="/auth" replace />;
  if (profile.role !== 'admin') return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div className="flex-1 flex justify-center items-center py-20 min-h-screen bg-slate-950 text-slate-300">
      <Loader2 className="animate-spin" size={32} />
    </div>
  );
}

function BannedScreen() {
  const { signOut } = useAuthStore();
  return (
    <div className="flex-1 flex flex-col justify-center items-center py-20 min-h-screen bg-slate-950 text-slate-300 gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-red-500">অ্যাকাউন্ট সাসপেন্ড করা হয়েছে!</h1>
      <p>আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত করা হয়েছে। বিস্তারিত জানতে সাপোর্টে যোগাযোগ করুন।</p>
      <button onClick={() => signOut()} className="mt-4 px-4 py-2 bg-slate-800 rounded-lg text-sm">
        লগ আউট করুন
      </button>
    </div>
  );
}

export default function App() {
  const { checkSession, isLoading } = useAuthStore();

  const location = useLocation();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#1e293b',
          color: '#fff',
        }
      }} />
      <AnimatePresence mode="wait">
        {/* @ts-ignore - React Router type mismatch for key */}
        <Routes location={location} key={location.pathname}>
          <Route path="/auth" element={<Auth />} />
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="/" element={<Home />} />
            <Route path="/task/:id" element={<TaskDetail />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
            <Route path="/admin/tasks" element={<RequireAdmin><AdminTasks /></RequireAdmin>} />
            <Route path="/admin/submissions" element={<RequireAdmin><AdminSubmissions /></RequireAdmin>} />
            <Route path="/admin/finances" element={<RequireAdmin><AdminFinances /></RequireAdmin>} />
            <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
            <Route path="/admin/settings" element={<RequireAdmin><AdminSettings /></RequireAdmin>} />
          </Route>
        </Routes>
      </AnimatePresence>
    </>
  );
}
