import React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { Loader2, ArrowRightLeft, Upload, ArrowDownToLine, HandCoins } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';
import { motion } from 'motion/react';

export default function Wallet() {
  const { profile, checkSession } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'convert' | 'deposit' | 'withdraw'>('convert');
  const [loading, setLoading] = useState(false);
  
  // Convert
  const [convertRate, setConvertRate] = useState(1);
  const [convertAmount, setConvertAmount] = useState('');

  // Deposit
  const [depAmount, setDepAmount] = useState('');
  const [depTrx, setDepTrx] = useState('');
  const adminBkash = '01540388621';

  // Withdraw
  const [withAmount, setWithAmount] = useState('');
  const [withBkash, setWithBkash] = useState('');

  // History
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  useEffect(() => {
    fetchRate();
    if (profile) fetchHistory();
    const handleSwitch = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener('switch-tab', handleSwitch);
    return () => window.removeEventListener('switch-tab', handleSwitch);
  }, [profile]);

  const fetchHistory = async () => {
    if (!profile) return;
    
    // Fetch withdraws
    const { data: withdraws } = await supabase
      .from('withdraw_requests')
      .select('*')
      .eq('user_id', profile.id);
      
    // Fetch deposits
    const { data: deposits } = await supabase
      .from('deposit_requests')
      .select('*')
      .eq('user_id', profile.id);

    let allItems: any[] = [];
    if (withdraws) allItems = [...allItems, ...withdraws.map(i => ({ ...i, type: 'withdraw' }))];
    if (deposits) allItems = [...allItems, ...deposits.map(i => ({ ...i, type: 'deposit' }))];
    
    // Sort descending
    allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setHistoryItems(allItems);
  };

  const fetchRate = async () => {
    const { data } = await supabase.from('conversion_settings').select('point_to_bdt_rate').eq('id', 1).single();
    if (data) setConvertRate(data.point_to_bdt_rate);
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const pts = parseFloat(convertAmount);
    if (isNaN(pts) || pts <= 0) return toast.error("সঠিক পরিমাণ দিন");
    if (pts > profile.points) return toast.error("পর্যাপ্ত পয়েন্ট নেই");

    setLoading(true);
    try {
      const bdtAmount = pts * convertRate;
      // RPC or direct update? Supabase rpc is better but standard update also works if we fetch first
      // Assuming straightforward logic for demonstration. RLS allows update to own profile.
      const newPoints = profile.points - pts;
      const newBalance = profile.balance + bdtAmount;

      const { error } = await supabase.from('profiles').update({
        points: newPoints,
        balance: newBalance
      }).eq('id', profile.id);

      if (error) throw error;
      toast.success("সফলভাবে কনভার্ট হয়েছে!");
      setConvertAmount('');
      checkSession(); // Update store
    } catch (err: any) {
      toast.error("সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const amount = parseFloat(depAmount);
    if (isNaN(amount) || amount <= 0) return toast.error("সঠিক পরিমাণ দিন");

    setLoading(true);
    try {
      const { error } = await supabase.from('deposit_requests').insert({
        user_id: profile.id,
        amount,
        transaction_id: depTrx
      });
      if (error) throw error;
      toast.success("ডিপোজিট রিকোয়েস্ট সফল!");
      setDepAmount('');
      setDepTrx('');
    } catch (err: any) {
      toast.error("সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const amount = parseFloat(withAmount);
    if (isNaN(amount) || amount < 500) return toast.error("সর্বনিম্ন উইথড্র ৫০০ টাকা");
    // Only check if it's strictly > balance, ideally we'd also deduct it into `pending_balance` but simply let admin handle it or deny.
    // Realistic implementation: deduct balance immediately and mark as pending.
    if (amount > profile.balance) return toast.error("পর্যাপ্ত ব্যালেন্স নেই");

    setLoading(true);
    try {
      // Create request
      const { error } = await supabase.from('withdraw_requests').insert({
        user_id: profile.id,
        amount,
        bkash_number: withBkash
      });
      if (error) throw error;

      // Update balance
      await supabase.from('profiles').update({
        balance: profile.balance - amount
      }).eq('id', profile.id);

      toast.success("উইথড্র রিকোয়েস্ট সফল!");
      setWithAmount('');
      setWithBkash('');
      checkSession();
    } catch (err: any) {
      toast.error("সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
    <div className="p-4 flex flex-col gap-6">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-5 relative overflow-hidden shadow-xl border border-white/10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-indigo-100 opacity-80">মোট ব্যালেন্স</p>
            <h1 className="text-3xl font-black text-white">৳ {profile?.balance || 0}</h1>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
            <p className="text-[10px] font-bold text-white">প্রো মেম্বার</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
          <div className="bg-white/10 p-3 rounded-2xl">
            <p className="text-[10px] text-indigo-100">পয়েন্ট</p>
            <p className="font-bold text-white">{profile?.points || 0} pts</p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl">
            <p className="text-[10px] text-indigo-100">পেন্ডিং</p>
            <p className="font-bold italic text-white">৳ {profile?.pending_balance || 0}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900 p-1 rounded-2xl gap-1 overflow-x-auto whitespace-nowrap hide-scrollbar">
        <TabBtn active={activeTab === 'convert'} onClick={() => setActiveTab('convert')} icon={<ArrowRightLeft size={16}/>} label="কনভার্ট" />
        <TabBtn active={activeTab === 'deposit'} onClick={() => setActiveTab('deposit')} icon={<ArrowDownToLine size={16}/>} label="ডিপোজিট" />
        <TabBtn active={activeTab === 'withdraw'} onClick={() => setActiveTab('withdraw')} icon={<Upload size={16}/>} label="উইথড্র" />
        <TabBtn active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<HandCoins size={16}/>} label="স্ট্যাটাস/হিস্ট্রি" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm">
        {activeTab === 'convert' && (
          <form onSubmit={handleConvert} className="flex flex-col gap-4">
            <div className="bg-slate-800 rounded-xl p-4 text-sm text-slate-300 text-center flex items-center justify-center gap-2">
              <HandCoins className="text-yellow-500"/> কনভার্ট রেট: ১ পয়েন্ট = ৳{convertRate}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">পয়েন্ট পরিমাণ</label>
              <input 
                type="number" required 
                value={convertAmount} onChange={e=>setConvertAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100" 
                placeholder="0"
              />
            </div>
            {convertAmount && !isNaN(parseFloat(convertAmount)) && (
              <p className="text-sm text-emerald-400 font-medium">আপনি পাবেন: ৳{(parseFloat(convertAmount) * convertRate).toFixed(2)}</p>
            )}
            <Button loading={loading} text="ব্যালেন্সে রূপান্তর করুন" />
          </form>
        )}

        {activeTab === 'deposit' && (
          <form onSubmit={handleDeposit} className="flex flex-col gap-4">
            <div className="bg-blue-900/20 border border-blue-900/50 rounded-xl p-4 text-sm">
              <p className="text-blue-200">বিকাশ সেন্ড মানি করুন:</p>
              <p className="text-xl font-bold text-blue-400 mt-1">01000000000</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">টাকার পরিমাণ</label>
              <input 
                type="number" required 
                value={depAmount} onChange={e=>setDepAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100" 
                placeholder="৳"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">টিআরএক্স আইডি (TrxID)</label>
              <input 
                type="text" required 
                value={depTrx} onChange={e=>setDepTrx(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100" 
                placeholder="AX82..."
              />
            </div>
            <Button loading={loading} text="ডিপোজিট রিকোয়েস্ট পাঠান" />
          </form>
        )}

        {activeTab === 'withdraw' && (
          <form onSubmit={handleWithdraw} className="flex flex-col gap-4">
            <div className="bg-slate-800 rounded-xl p-4 text-sm text-slate-300 text-center">
              সর্বনিম্ন উইথড্র: ৳৫০০
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">উইথড্র করার পরিমাণ</label>
              <input 
                type="number" required min="500"
                value={withAmount} onChange={e=>setWithAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100" 
                placeholder="৳"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">আপনার পার্সোনাল বিকাশ নাম্বার</label>
              <input 
                type="text" required 
                value={withBkash} onChange={e=>setWithBkash(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100" 
                placeholder="01..."
              />
            </div>
            <Button loading={loading} text="উইথড্র রিকোয়েস্ট পাঠান" />
          </form>
        )}

        {activeTab === 'history' && (
          <div className="flex flex-col gap-3">
            <div className="bg-slate-800 rounded-xl p-3 text-sm text-slate-300 text-center mb-2">
              আপনার ট্রানজেকশন হিস্ট্রি ও স্ট্যাটাস
            </div>
            {historyItems.length === 0 ? (
              <p className="text-center text-slate-500 py-6">কোন রেকর্ড পাওয়া যায়নি</p>
            ) : (
              historyItems.map((item, idx) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  key={idx} 
                  className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      {item.type === 'withdraw' ? <Upload size={14} className="text-red-400" /> : <ArrowDownToLine size={14} className="text-emerald-400" />}
                      <span className="font-bold text-sm text-slate-200">
                        {item.type === 'withdraw' ? 'উইথড্র' : 'ডিপোজিট'}
                      </span>
                    </div>
                    <p className="text-lg font-bold mt-1 text-slate-100">৳{item.amount}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    {item.status === 'pending' && <span className="bg-yellow-500/20 text-yellow-500 text-xs px-3 py-1 rounded-lg font-medium">পেন্ডিং</span>}
                    {item.status === 'approved' && <span className="bg-emerald-500/20 text-emerald-500 text-xs px-3 py-1 rounded-lg font-medium">সফল</span>}
                    {item.status === 'rejected' && <span className="bg-red-500/20 text-red-500 text-xs px-3 py-1 rounded-lg font-medium">বাতিল</span>}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

    </div>
    </PageTransition>
  );
}

function TabBtn({ active, onClick, label, icon }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
    >
      {icon} {label}
    </button>
  );
}

function Button({ loading, text }: { loading: boolean, text: string }) {
  return (
    <button 
      type="submit" disabled={loading}
      className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="animate-spin" size={20} /> : text}
    </button>
  );
}
