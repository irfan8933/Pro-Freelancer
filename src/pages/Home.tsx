import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Task, Submission, ConversionSetting } from '../types';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { CheckCircle, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';
import { motion } from 'motion/react';

export default function Home() {
  const { profile } = useAuthStore();
  const [newTasks, setNewTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<{task: Task, status: string}[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('public:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchData(); 
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const fetchData = async () => {
    if (!profile) return;

    const [tasksRes, subRes, settingsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('submissions').select('task_id, status').eq('user_id', profile.id),
      supabase.from('conversion_settings').select('*').single()
    ]);

    if (settingsRes.data && settingsRes.data.notice_active && settingsRes.data.notice_text) {
      setNotice(settingsRes.data.notice_text);
    }

    const allTasks = (tasksRes.data || []) as Task[];
    const subs = (subRes.data || []) as { task_id: string, status: string }[];

    const subMap = new Map(subs.map(s => [s.task_id, s.status]));

    const nTasks: Task[] = [];
    const cTasks: {task: Task, status: string}[] = [];

    allTasks.forEach(task => {
      if (subMap.has(task.id)) {
        cTasks.push({ task, status: subMap.get(task.id)! });
      } else {
        nTasks.push(task);
      }
    });

    setNewTasks(nTasks);
    setCompletedTasks(cTasks);
    setLoading(false);
  };

  return (
    <PageTransition>
    <div className="p-4 flex flex-col gap-6">
      {/* App Header */}
      <div className="flex items-center justify-between mb-2 mt-2">
        <div className="flex items-center gap-3">
          <img src="https://storage.googleapis.com/aistudio-user-uploads/62f6b3b5-3162-41f7-bc32-ea7d2999e46a.png" alt="Logo" className="w-12 h-12 rounded-full object-cover bg-white" />
          <div>
            <p className="text-xs text-slate-400">স্বাগতম,</p>
            <h2 className="text-lg font-bold text-white">{profile?.full_name || 'ইউজার'} 👋</h2>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <span className="text-slate-900 font-black">{profile?.full_name?.substring(0, 2).toUpperCase() || 'U'}</span>
        </div>
      </div>

      {notice && (
        <motion.div initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} className="bg-red-500/10 border border-red-500/20 text-red-100 p-3 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{notice}</p>
        </motion.div>
      )}

      {/* Wallet Card (Immersive Style) */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-5 relative overflow-hidden shadow-xl border border-white/10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-indigo-100 opacity-80">মোট ব্যালেন্স</p>
            <h1 className="text-3xl font-black">৳ {profile?.balance || 0}</h1>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
            <p className="text-[10px] font-bold">প্রো মেম্বার</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
          <div className="bg-white/10 p-3 rounded-2xl">
            <p className="text-[10px] text-indigo-100">পয়েন্ট</p>
            <p className="font-bold">{profile?.points || 0} pts</p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl">
            <p className="text-[10px] text-indigo-100">পেন্ডিং</p>
            <p className="font-bold italic">৳ {profile?.pending_balance || 0}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-around py-2 gap-3 overflow-x-auto no-scrollbar">
        <Link to="/wallet" className="flex flex-col items-center gap-2 shrink-0">
          <button className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center hover:bg-slate-700 border border-slate-700 transition-colors shadow-lg">
            <span className="text-xl">📥</span>
          </button>
          <span className="text-[10px] text-slate-300">ডিপোজিট</span>
        </Link>
        <Link to="/wallet" onClick={() => setTimeout(() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'withdraw' })), 50)} className="flex flex-col items-center gap-2 shrink-0">
          <button className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center hover:bg-slate-700 border border-slate-700 transition-colors shadow-lg">
            <span className="text-xl">📤</span>
          </button>
          <span className="text-[10px] text-slate-300">উইথড্র</span>
        </Link>
        <Link to="/wallet" onClick={() => setTimeout(() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'convert' })), 50)} className="flex flex-col items-center gap-2 shrink-0">
          <button className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center hover:bg-slate-700 border border-slate-700 transition-colors shadow-lg">
            <span className="text-xl">🔄</span>
          </button>
          <span className="text-[10px] text-slate-300">কনভার্ট</span>
        </Link>
        <Link to="/history" className="flex flex-col items-center gap-2 shrink-0">
          <button className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center hover:bg-slate-700 border border-slate-700 transition-colors shadow-lg">
            <span className="text-xl">📜</span>
          </button>
          <span className="text-[10px] text-slate-300">হিস্টোরি</span>
        </Link>
        <Link to="/profile" className="flex flex-col items-center gap-2 shrink-0">
          <button className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center hover:bg-slate-700 border border-slate-700 transition-colors shadow-lg">
            <span className="text-xl">🎁</span>
          </button>
          <span className="text-[10px] text-slate-300">রেফারেল</span>
        </Link>
      </div>

      {/* Social Join Banner */}
      <div className="flex gap-2">
        <a href="https://t.me/+wD4NQQz_P5dlZGVl" target="_blank" rel="noreferrer" className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 py-3 rounded-2xl flex justify-center items-center gap-2 transition-colors text-blue-400 font-medium text-sm">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.6.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
          টেলিগ্রাম
        </a>
        <a href="https://www.facebook.com/profreelancer.bd" target="_blank" rel="noreferrer" className="flex-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 py-3 rounded-2xl flex justify-center items-center gap-2 transition-colors text-indigo-400 font-medium text-sm">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7v-3h3V9.5C10 6.57 11.75 5 14.39 5c1.28 0 2.61.23 2.61.23v2.87h-1.47c-1.45 0-1.9.9-1.9 1.83V12h3.2l-.51 3h-2.69v6.8c4.56-.93 8-4.96 8-9.8z"/></svg>
          ফেসবুক
        </a>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4 mt-2">
          <h3 className="text-md font-bold text-slate-100">নতুন কাজসমূহ</h3>
          <span className="text-xs text-indigo-400 font-medium cursor-pointer">সব দেখুন</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-slate-800/50 rounded-2xl h-20 w-full"></div>
            ))}
          </div>
        ) : newTasks.length === 0 ? (
          <div className="text-center py-10 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-700">
            <p>বর্তমানে কোন কাজ নেই</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {newTasks.map((task, idx) => {
              const bgColors = ['bg-red-500/20', 'bg-blue-500/20', 'bg-green-500/20', 'bg-yellow-500/20', 'bg-purple-500/20'];
              const textColors = ['text-red-500', 'text-blue-500', 'text-green-500', 'text-yellow-500', 'text-purple-500'];
              const bgColorClass = bgColors[idx % bgColors.length];
              const textColorClass = textColors[idx % textColors.length];
              const shortName = task.title.substring(0, 2).toUpperCase();

              return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
              >
              <Link 
                to={`/task/${task.id}`} 
                className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex items-center gap-4 hover:bg-slate-800 transition-colors block"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColorClass}`}>
                  <span className={`font-bold ${textColorClass}`}>{shortName}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold truncate text-slate-100">{task.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded whitespace-nowrap">
                      {task.category || 'সাধারণ'}
                    </span>
                  </div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className="text-yellow-400 font-bold">{task.reward_points} pts</p>
                </div>
              </Link>
              </motion.div>
            )})}
          </div>
        )}
      </div>

      {completedTasks.length > 0 && (
        <div className="mt-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-bold text-slate-100 mb-0">সম্পন্ন কাজসমূহ</h3>
          </div>
          <div className="grid gap-3 opacity-60">
            {completedTasks.map(({task, status}, idx) => {
              const bgColors = ['bg-slate-500/20'];
              const textColors = ['text-slate-500'];
              const shortName = task.title.substring(0, 2).toUpperCase();

              return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
              >
              <Link 
                to={`/task/${task.id}`} 
                className="bg-slate-800/20 p-4 rounded-2xl border border-slate-800 flex items-center gap-4 hover:bg-slate-800/40 transition-colors block grayscale"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-slate-800`}>
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold truncate text-slate-300 line-through decoration-slate-600">{task.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 bg-slate-700/50 text-slate-400 rounded whitespace-nowrap">
                      {status === 'approved' ? 'গৃহীত হয়েছে' : status === 'rejected' ? 'বাতিল' : 'পেন্ডিং'}
                    </span>
                  </div>
                </div>
              </Link>
              </motion.div>
            )})}
          </div>
        </div>
      )}
    </div>
    </PageTransition>
  );
}
