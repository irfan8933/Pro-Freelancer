import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminFinances() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'deposits' | 'withdraws'>('deposits');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems(tab);
    // basic realtime reload via postgres_changes
    const channel = supabase.channel(`admin:${tab}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tab === 'deposits' ? 'deposit_requests' : 'withdraw_requests' }, () => {
        fetchItems(tab);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tab]);

  const fetchItems = async (currentTab: string) => {
    setLoading(true);
    const table = currentTab === 'deposits' ? 'deposit_requests' : 'withdraw_requests';
    const { data } = await supabase
      .from(table)
      .select('*, profiles(full_name, balance)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const handleAction = async (item: any, action: 'approved' | 'rejected') => {
    try {
      const table = tab === 'deposits' ? 'deposit_requests' : 'withdraw_requests';
      const { error } = await supabase.from(table).update({ status: action }).eq('id', item.id);
      if (error) throw error;

      if (action === 'approved' && tab === 'deposits') {
        await supabase.from('profiles').update({
          balance: item.profiles.balance + item.amount
        }).eq('id', item.user_id);
      }
      
      // If withdraw is approved, balance was already deducted on request (in our current conceptual flow, yes we deducted it!). 
      // If withdraw is REJECTED, we must refund balance! Let's do that:
      if (action === 'rejected' && tab === 'withdraws') {
        const {data: prof} = await supabase.from('profiles').select('balance').eq('id', item.user_id).single();
        if (prof) {
          await supabase.from('profiles').update({
            balance: prof.balance + item.amount
          }).eq('id', item.user_id);
        }
      }

      toast.success(action === 'approved' ? 'অ্যাপ্রুভ করা হয়েছে' : 'বাতিল করা হয়েছে');
      fetchItems(tab);
    } catch(err) {
      toast.error('সমস্যা হয়েছে');
    }
  };

  return (
    <div className="min-h-full bg-slate-950 pb-20">
      <div className="sticky top-0 bg-slate-950/80 backdrop-blur-md z-10 px-4 py-4 flex flex-col gap-3 border-b border-slate-900">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="p-2 bg-slate-900 rounded-full">
             <ArrowLeft size={20} />
          </button>
          <h2 className="font-bold text-lg">আর্থিক রিকোয়েস্ট</h2>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-xl">
          <button onClick={() => setTab('deposits')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === 'deposits' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>ডিপোজিট</button>
          <button onClick={() => setTab('withdraws')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === 'withdraws' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>উইথড্র</button>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="text-center p-10 text-slate-500">কোন পেন্ডিং রিকোয়েস্ট নাই</div>
        ) : (
          <div className="grid gap-4">
            {items.map(item => (
              <div key={item.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-200">৳{item.amount}</h4>
                    <p className="text-xs text-slate-400 mt-1">ইউজার: {item.profiles.full_name}</p>
                    {tab === 'deposits' ? (
                      <p className="text-xs font-mono text-emerald-400 mt-1 bg-emerald-500/10 px-2 py-1 rounded inline-block">TrxID: {item.transaction_id}</p>
                    ) : (
                      <p className="text-xs font-mono text-blue-400 mt-1 bg-blue-500/10 px-2 py-1 rounded inline-block">Bkash: {item.bkash_number}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => handleAction(item, 'rejected')} className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 rounded-xl flex justify-center items-center gap-1 font-medium transition-colors">
                    <X size={16}/> বাতিল
                  </button>
                  <button onClick={() => handleAction(item, 'approved')} className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 py-2 rounded-xl flex justify-center items-center gap-1 font-medium transition-colors">
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
