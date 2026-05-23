import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { PageTransition } from '../components/PageTransition';
import { motion } from 'motion/react';
import { History as HistoryIcon, ArrowLeft, Loader2, DollarSign, CheckCircle, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function History() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [profile]);

  const fetchHistory = async () => {
    if (!profile) return;

    // Fetch points ledger
    const { data: points } = await supabase
      .from('points_ledger')
      .select('*, task:tasks(title)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    // Fetch conversions
    const { data: withdrawals } = await supabase
      .from('withdraw_requests')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    const { data: deposits } = await supabase
      .from('deposit_requests')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    // Notices
    const { data: settingsRes } = await supabase
      .from('conversion_settings')
      .select('*')
      .single();

    let allItems: any[] = [];
    if (points) allItems = [...allItems, ...points.map(p => ({ ...p, type: 'points' }))];
    if (withdrawals) allItems = [...allItems, ...withdrawals.map(w => ({ ...w, type: 'withdraw' }))];
    if (deposits) allItems = [...allItems, ...deposits.map(d => ({ ...d, type: 'deposit' }))];

    if (settingsRes?.notice_active && settingsRes?.notice_text) {
      allItems.push({
        id: 'notice-' + settingsRes.id,
        type: 'notice',
        message: settingsRes.notice_text,
        created_at: settingsRes.updated_at
      });
    }

    allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setItems(allItems);
    setLoading(false);
  };

  return (
    <PageTransition>
      <div className="bg-slate-950 min-h-screen pb-20">
        <div className="sticky top-0 bg-slate-950/80 backdrop-blur-md z-10 px-4 py-4 flex items-center gap-3 border-b border-slate-900">
          <button onClick={() => navigate(-1)} className="p-2 bg-slate-900 rounded-full hover:bg-slate-800 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">হিস্টোরি</h1>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400" size={32} /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-slate-500">কোন হিস্টোরি নেই</div>
          ) : (
            items.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex gap-4 items-center"
              >
                {item.type === 'points' && (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <CheckCircle size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-slate-100">{item.task?.title || 'কাজ সম্পন্ন'}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400">+{item.points} pts</p>
                    </div>
                  </>
                )}
                {item.type === 'withdraw' && (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                      <DollarSign size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-slate-100">উইথড্র: {item.bkash_number}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(item.created_at).toLocaleString()} • {item.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-400">-৳ {item.amount}</p>
                    </div>
                  </>
                )}
                {item.type === 'deposit' && (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <DollarSign size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-slate-100">ডিপোজিট</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(item.created_at).toLocaleString()} • {item.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400">+৳ {item.amount}</p>
                    </div>
                  </>
                )}
                {item.type === 'notice' && (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                      <Bell size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-yellow-400">অ্যাডমিন আপডেট</p>
                      <p className="text-sm text-slate-300 mt-1">{item.message}</p>
                      <p className="text-xs text-slate-500 mt-2">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                  </>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </PageTransition>
  );
}
