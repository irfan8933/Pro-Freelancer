import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Submission, Profile } from '../../types';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminSubmissions() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubs();

    const channel = supabase.channel('admin:subs')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => {
      fetchSubs();
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchSubs = async () => {
    const { data } = await supabase
      .from('submissions')
      .select('*, tasks(title, reward_points), profiles(full_name, balance, points)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (data) setSubmissions(data);
    setLoading(false);
  };

  const handleAction = async (sub: any, action: 'approved' | 'rejected') => {
    try {
      // update sub
      const { error } = await supabase.from('submissions').update({ status: action }).eq('id', sub.id);
      if (error) throw error;

      if (action === 'approved') {
        // update user points
        await supabase.from('profiles').update({
          points: sub.profiles.points + sub.tasks.reward_points
        }).eq('id', sub.user_id);
        
        // add ledger
        await supabase.from('points_ledger').insert({
          user_id: sub.user_id,
          task_id: sub.task_id,
          points: sub.tasks.reward_points,
          reason: 'task_completion'
        });
      }
      toast.success(action === 'approved' ? 'অ্যাপ্রুভ করা হয়েছে' : 'বাতিল করা হয়েছে');
      fetchSubs();
    } catch(err) {
      toast.error('সমস্যা হয়েছে');
    }
  };

  return (
    <div className="min-h-full bg-slate-950 pb-20">
      <div className="sticky top-0 bg-slate-950/80 backdrop-blur-md z-10 px-4 py-4 flex items-center gap-3 border-b border-slate-900">
        <button onClick={() => navigate('/admin')} className="p-2 bg-slate-900 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-lg">পেন্ডিং সাবমিশন</h2>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
        ) : submissions.length === 0 ? (
          <div className="text-center p-10 text-slate-500">কোন পেন্ডিং নাই</div>
        ) : (
          <div className="grid gap-4">
            {submissions.map(sub => (
              <div key={sub.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-200">{sub.tasks.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">ইউজার: {sub.profiles.full_name}</p>
                    <p className="text-xs font-bold text-blue-400 mt-1">পুরস্কার: {sub.tasks.reward_points} 🪙</p>
                  </div>
                </div>
                
                <a href={sub.screenshot_url} target="_blank" rel="noreferrer" className="block w-full">
                  <img src={sub.screenshot_url} alt="Proof" className="w-full h-32 object-cover rounded-xl border border-slate-800 bg-slate-950" />
                </a>

                {sub.note && <p className="text-xs text-slate-400 bg-slate-950 p-2 rounded-lg">নোট: {sub.note}</p>}

                <div className="flex gap-2">
                  <button onClick={() => handleAction(sub, 'rejected')} className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 rounded-xl flex justify-center items-center gap-1 font-medium transition-colors">
                    <X size={16}/> বাতিল
                  </button>
                  <button onClick={() => handleAction(sub, 'approved')} className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 py-2 rounded-xl flex justify-center items-center gap-1 font-medium transition-colors">
                    <Check size={16}/> অ্যাপ্রুভ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
