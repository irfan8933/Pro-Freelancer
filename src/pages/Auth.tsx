import React from 'react';
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';

export default function Auth() {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  if (user && profile) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("লগইন সফল হয়েছে!");
        await useAuthStore.getState().checkSession();
        const { profile } = useAuthStore.getState();
        if (profile?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (error) throw error;
        
        if (data?.session) {
          toast.success("অ্যাকাউন্ট তৈরি সফল হয়েছে!");
          useAuthStore.getState().checkSession();
        } else {
          // Fallback if session is null due to some other policy, but auto confirm trigger is active so it's unlikely
          toast.success("অ্যাকাউন্ট তৈরি হয়েছে! আপনি এখন লগইন করতে পারবেন।");
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "কিছু ভুল হয়েছে!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
    <div className="flex flex-col min-h-screen bg-[#030712] p-4 font-sans text-slate-100 items-center justify-center relative overflow-hidden">
      {/* Design Accents background */}
      <div className="absolute top-0 right-0 p-10 pointer-events-none opacity-20 hidden md:block">
        <h1 className="text-[120px] font-black text-white/10 leading-none">PRO<br/>EARN</h1>
      </div>

      <div className="w-full max-w-sm mt-8 text-center relative z-10 flex flex-col items-center">
        <img src="https://storage.googleapis.com/aistudio-user-uploads/62f6b3b5-3162-41f7-bc32-ea7d2999e46a.png" alt="Pro Freelancer Logo" className="w-20 h-20 rounded-full object-cover bg-white mb-4 shadow-xl border-2 border-indigo-500/30" />
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Pro Freelancer</h1>
        <p className="text-slate-400 font-medium">আপনার মাল্টি-টাস্ক আর্নিং প্ল্যাটফর্ম</p>
      </div>

      <div className="w-full max-w-sm mt-10 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-[32px] p-8 shadow-2xl relative z-10">
        <h2 className="text-2xl font-bold text-white mb-6">
          {isLogin ? 'লগইন করুন' : 'অ্যাকাউন্ট তৈরি করুন'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">আপনার নাম</label>
              <input 
                type="text" 
                required 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all font-medium placeholder-slate-600"
                placeholder="যেমন: মোঃ রহিম"
              />
            </div>
          )}
          
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">ইমেইল ঠিকানা</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all font-medium placeholder-slate-600"
              placeholder="example@mail.com"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">পাসওয়ার্ড</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all font-medium placeholder-slate-600"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl flex justify-center items-center gap-2 transition-colors disabled:opacity-50 tracking-wide shadow-lg shadow-indigo-600/20"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'লগইন' : 'রেজিস্টার')}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800/50 pt-6">
          <p className="text-sm font-medium text-slate-400">
            {isLogin ? 'অ্যাকাউন্ট নেই?' : 'ইতোমধ্যে অ্যাকাউন্ট আছে?'}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-indigo-400 font-bold ml-2 hover:underline hover:text-indigo-300 transition-colors"
            >
              {isLogin ? 'রেজিস্টার করুন' : 'লগইন করুন'}
            </button>
          </p>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
